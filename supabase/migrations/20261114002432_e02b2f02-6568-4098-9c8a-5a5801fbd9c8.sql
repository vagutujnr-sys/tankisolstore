CREATE FUNCTION public.developer_has_published_app(_developer_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.applications a WHERE a.developer_id = _developer_id AND a.status = 'published'::public.app_status); $$;
REVOKE ALL ON FUNCTION public.developer_has_published_app(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.developer_has_published_app(uuid) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.developer_has_published_app(uuid) IS 'Public boolean only: avoids developers/applications RLS recursion without exposing unpublished app data.';
DROP POLICY "developers public" ON public.developers;
CREATE POLICY "developers published authors" ON public.developers FOR SELECT TO anon, authenticated USING (public.developer_has_published_app(id));
CREATE POLICY "developers read own" ON public.developers FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.is_published_app_media(_object_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
 SELECT EXISTS (SELECT 1 FROM public.applications a WHERE a.status = 'published'::public.app_status AND a.icon_url = 'storage://app-media/' || _object_name)
 OR EXISTS (SELECT 1 FROM public.application_screenshots s JOIN public.applications a ON a.id = s.application_id WHERE a.status = 'published'::public.app_status AND s.url = 'storage://app-media/' || _object_name);
$$;
REVOKE ALL ON FUNCTION public.is_published_app_media(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_published_app_media(text) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.is_published_app_media(text) IS 'Public boolean only: an exact object path must be referenced by a published app.';
DROP POLICY "app media read" ON storage.objects;
CREATE POLICY "app media read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'app-media' AND (
 owner_id = (SELECT auth.uid()::text)
 OR public.is_admin((SELECT auth.uid()))
 OR public.is_published_app_media(storage.objects.name)
));