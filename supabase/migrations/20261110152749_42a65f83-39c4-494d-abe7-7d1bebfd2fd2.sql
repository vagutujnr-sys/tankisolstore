UPDATE public.applications SET is_demo = false, status = 'approved' WHERE is_demo = true;

INSERT INTO public.developers (name, website) SELECT 'Unknown author', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.developers WHERE name = 'Unknown author');

WITH d AS (SELECT id FROM public.developers WHERE name='Unknown author' LIMIT 1),
c AS (SELECT slug, id FROM public.application_categories)
INSERT INTO public.applications (slug,name,short_description,description,icon_url,category_id,developer_id,app_url,website_url,features,keywords,status,is_featured)
SELECT v.slug,v.name,v.sd,v.descr,v.icon,(SELECT id FROM c WHERE c.slug=v.cat),(SELECT id FROM d),v.url,v.url,v.feat,v.kw,'published',v.feat_flag
FROM (VALUES
 ('squoosh','Squoosh','Compress and compare images, right in your browser.','Squoosh is an image compression web app that reduces image sizes through numerous formats, with a side-by-side preview. Works offline once installed.','https://squoosh.app/c/icon-large-cb438cac.png','utilities','https://squoosh.app/',ARRAY['Offline support','Side-by-side compare','WebP, AVIF, MozJPEG'],ARRAY['image','compress','photo'],true),
 ('excalidraw','Excalidraw','Virtual whiteboard for sketching hand-drawn diagrams.','Excalidraw is a whiteboard tool that lets you easily sketch diagrams that have a hand-drawn feel. Collaborate live and export to PNG or SVG.','https://excalidraw.com/android-chrome-192x192.png','productivity','https://excalidraw.com/',ARRAY['Live collaboration','Export PNG/SVG','End-to-end encrypted'],ARRAY['whiteboard','diagram','drawing'],true),
 ('photopea','Photopea','Free advanced photo editor that opens PSD, XCF and Sketch files.','Photopea is a free online photo editor supporting PSD, XCF, Sketch, XD and CDR formats, with layers, masks and smart objects.','https://www.photopea.com/promo/icon512.png','entertainment','https://www.photopea.com/',ARRAY['Opens PSD files','Layers and masks','No sign-up'],ARRAY['photo','editor','psd','design'],false),
 ('devdocs','DevDocs','Fast, offline API documentation browser.','DevDocs combines multiple developer documentations in a clean, organised web UI with instant search and offline support.','https://devdocs.io/images/webapp-icon-512.png','education','https://devdocs.io/',ARRAY['Offline docs','Instant search','100+ documentations'],ARRAY['docs','developer','api','programming'],false),
 ('tldraw','tldraw','A very good free whiteboard.','tldraw is a fast, collaborative whiteboard for drawing, diagramming and brainstorming in the browser.','https://www.tldraw.com/android-chrome-512x512.png','productivity','https://www.tldraw.com/',ARRAY['Infinite canvas','Multiplayer','Free'],ARRAY['whiteboard','drawing','canvas'],false)
) AS v(slug,name,sd,descr,icon,cat,url,feat,kw,feat_flag)
ON CONFLICT DO NOTHING;

INSERT INTO public.application_screenshots (application_id,url,sort_order)
SELECT a.id, s.url, s.ord FROM (VALUES
 ('squoosh','https://squoosh.app/c/screenshot1-0ff68546.png',1),
 ('squoosh','https://squoosh.app/c/screenshot2-1f78c4db.jpg',2),
 ('squoosh','https://squoosh.app/c/screenshot3-c1e02216.jpg',3),
 ('excalidraw','https://excalidraw.com/screenshots/virtual-whiteboard.png',1),
 ('excalidraw','https://excalidraw.com/screenshots/wireframe.png',2),
 ('excalidraw','https://excalidraw.com/screenshots/illustration.png',3),
 ('excalidraw','https://excalidraw.com/screenshots/collaboration.png',4),
 ('photopea','/__l5e/assets-v1/3bf87b38-0b39-4657-b4da-a03503f941fe/photopea-narrow.jpg',1),
 ('photopea','/__l5e/assets-v1/53546e53-4d02-4540-b73d-52d6f5c55d18/photopea-wide.jpg',2),
 ('devdocs','/__l5e/assets-v1/dd7251cf-b088-4018-9b13-1826add5a922/devdocs-narrow.jpg',1),
 ('devdocs','/__l5e/assets-v1/38dc7a8c-096b-4bab-b78d-28cb1f980cfe/devdocs-wide.jpg',2),
 ('tldraw','/__l5e/assets-v1/b72c33b6-2532-4e55-af5f-882d9ea98bf6/tldraw-narrow.jpg',1),
 ('tldraw','/__l5e/assets-v1/abcf9b10-3164-4056-9da3-608467d31551/tldraw-wide.jpg',2)
) AS s(slug,url,ord) JOIN public.applications a ON a.slug = s.slug;