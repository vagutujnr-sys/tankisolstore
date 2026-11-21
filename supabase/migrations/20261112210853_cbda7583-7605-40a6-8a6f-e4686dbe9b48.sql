GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_screenshots TO authenticated;
CREATE POLICY "shots owner read" ON public.application_screenshots FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.developers d ON d.id=a.developer_id WHERE a.id=application_id AND d.user_id=auth.uid()));
CREATE POLICY "shots owner manage" ON public.application_screenshots FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.developers d ON d.id=a.developer_id WHERE a.id=application_id AND d.user_id=auth.uid() AND NOT d.is_suspended AND a.status IN ('draft','submitted','rejected'))) WITH CHECK (EXISTS (SELECT 1 FROM public.applications a JOIN public.developers d ON d.id=a.developer_id WHERE a.id=application_id AND d.user_id=auth.uid() AND NOT d.is_suspended AND a.status IN ('draft','submitted','rejected')));
CREATE POLICY "app media upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='app-media' AND (storage.foldername(name))[1]=auth.uid()::text AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp'));
CREATE POLICY "app media read" ON storage.objects FOR SELECT TO anon,authenticated USING (bucket_id='app-media' AND ((storage.foldername(name))[1]=auth.uid()::text OR public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.applications a WHERE a.status='published' AND a.icon_url='storage://app-media/'||name) OR EXISTS (SELECT 1 FROM public.application_screenshots s JOIN public.applications a ON a.id=s.application_id WHERE a.status='published' AND s.url='storage://app-media/'||name)));
CREATE POLICY "app media delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='app-media' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE OR REPLACE FUNCTION public.save_app_submission(payload jsonb, screenshot_urls text[], app_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE result_id uuid; chosen_status public.app_status; chosen_dev uuid; is_staff boolean := public.is_admin(auth.uid()); item text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to submit an app'; END IF;
 IF length(trim(payload->>'name')) NOT BETWEEN 1 AND 100 OR length(trim(payload->>'short_description')) NOT BETWEEN 1 AND 200 OR length(coalesce(payload->>'description',''))>6000 OR length(coalesce(payload->>'slug','')) NOT BETWEEN 1 AND 100 OR (payload->>'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'Invalid app details'; END IF;
 IF coalesce(payload->>'app_url','') !~ '^https://[^[:space:]]+$' OR length(payload->>'app_url')>2048 THEN RAISE EXCEPTION 'App link must use HTTPS'; END IF;
 FOREACH item IN ARRAY ARRAY[payload->>'icon_url',payload->>'website_url'] LOOP
 IF item IS NOT NULL AND item<>'' AND (length(item)>2048 OR (item !~ '^https://[^[:space:]]+$' AND item !~ '^storage://app-media/[a-f0-9-]+/[a-f0-9-]+\.(png|jpg|jpeg|webp)$')) THEN RAISE EXCEPTION 'Invalid image or website link'; END IF;
 END LOOP;
 IF coalesce(array_length(screenshot_urls,1),0)>8 THEN RAISE EXCEPTION 'Maximum 8 screenshots'; END IF;
 FOREACH item IN ARRAY coalesce(screenshot_urls,ARRAY[]::text[]) LOOP
 IF length(item)>2048 OR (item !~ '^https://[^[:space:]]+$' AND item !~ '^storage://app-media/[a-f0-9-]+/[a-f0-9-]+\.(png|jpg|jpeg|webp)$') THEN RAISE EXCEPTION 'Invalid screenshot link'; END IF;
 END LOOP;
 chosen_status := coalesce(payload->>'status','submitted')::public.app_status;
 IF NOT is_staff AND chosen_status NOT IN ('draft','submitted') THEN RAISE EXCEPTION 'Only admins can list apps'; END IF;
 IF is_staff THEN chosen_dev := nullif(payload->>'developer_id','')::uuid;
 ELSE
 SELECT id INTO chosen_dev FROM public.developers WHERE user_id=auth.uid() AND NOT is_suspended ORDER BY created_at LIMIT 1;
 IF chosen_dev IS NULL THEN
 INSERT INTO public.developers(user_id,name) VALUES(auth.uid(),coalesce(nullif(trim(payload->>'author_name'),''),'App owner')) RETURNING id INTO chosen_dev;
 END IF;
 END IF;
 IF app_id IS NULL THEN
 INSERT INTO public.applications(name,slug,short_description,description,icon_url,app_url,website_url,version,category_id,developer_id,status,keywords,features)
 VALUES(trim(payload->>'name'),payload->>'slug',trim(payload->>'short_description'),coalesce(payload->>'description',''),nullif(payload->>'icon_url',''),payload->>'app_url',nullif(payload->>'website_url',''),coalesce(nullif(payload->>'version',''),'1.0.0'),nullif(payload->>'category_id','')::uuid,chosen_dev,chosen_status,ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'keywords','[]'::jsonb))),ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'features','[]'::jsonb)))) RETURNING id INTO result_id;
 ELSE
 UPDATE public.applications SET name=trim(payload->>'name'),slug=payload->>'slug',short_description=trim(payload->>'short_description'),description=coalesce(payload->>'description',''),icon_url=nullif(payload->>'icon_url',''),app_url=payload->>'app_url',website_url=nullif(payload->>'website_url',''),version=coalesce(nullif(payload->>'version',''),'1.0.0'),category_id=nullif(payload->>'category_id','')::uuid,developer_id=chosen_dev,status=chosen_status,keywords=ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'keywords','[]'::jsonb))),features=ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'features','[]'::jsonb))) WHERE id=app_id RETURNING id INTO result_id;
 IF result_id IS NULL THEN RAISE EXCEPTION 'App not found or cannot be edited'; END IF;
 END IF;
 DELETE FROM public.application_screenshots WHERE application_id=result_id;
 INSERT INTO public.application_screenshots(application_id,url,sort_order) SELECT result_id,url,ordinality::integer-1 FROM unnest(coalesce(screenshot_urls,ARRAY[]::text[])) WITH ORDINALITY AS s(url,ordinality);
 RETURN result_id;
END; $$;
REVOKE ALL ON FUNCTION public.save_app_submission(jsonb,text[],uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_app_submission(jsonb,text[],uuid) TO authenticated;