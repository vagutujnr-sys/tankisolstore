
create type public.app_role as enum ('super_admin','admin','developer','user');
create type public.app_status as enum ('draft','submitted','under_review','approved','published','rejected','suspended');

create or replace function public.update_updated_at_column() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at = now(); return new; end; $$;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create or replace function public.is_admin(_user_id uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role in ('admin','super_admin')) $$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "super admin manages roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  email text,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profile read own or admin" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin(auth.uid()));
create policy "profile update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "admin update profiles" on public.profiles for update to authenticated using (public.is_admin(auth.uid()));
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.update_updated_at_column();

-- prevent non-admins from changing is_suspended
create or replace function public.guard_profile_suspension() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.is_suspended is distinct from old.is_suspended and not public.is_admin(auth.uid()) and auth.uid() is not null then
    new.is_suspended := old.is_suspended;
  end if;
  return new;
end; $$;
create trigger trg_profiles_guard before update on public.profiles for each row execute function public.guard_profile_suspension();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, display_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), new.email) on conflict do nothing;
  insert into public.user_roles(user_id, role) values (new.id,'user') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.grant_super_admin() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.email_confirmed_at is not null and lower(new.email) = 'vagutujnr@gmail.com' then
    insert into public.user_roles(user_id, role) values (new.id,'super_admin') on conflict do nothing;
    insert into public.user_roles(user_id, role) values (new.id,'admin') on conflict do nothing;
  end if;
  return new;
end; $$;
create trigger on_auth_user_created_super after insert on auth.users for each row execute function public.grant_super_admin();
create trigger on_auth_user_confirmed_super after update of email_confirmed_at on auth.users for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null) execute function public.grant_super_admin();

create table public.application_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  icon text not null default 'LayoutGrid',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.application_categories to anon, authenticated;
grant insert, update, delete on public.application_categories to authenticated;
grant all on public.application_categories to service_role;
alter table public.application_categories enable row level security;
create policy "categories public" on public.application_categories for select to anon, authenticated using (true);
create policy "categories admin" on public.application_categories for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.developers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  company text,
  website text,
  is_verified boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.developers to anon, authenticated;
grant insert, update on public.developers to authenticated;
grant all on public.developers to service_role;
alter table public.developers enable row level security;
create policy "developers public" on public.developers for select to anon, authenticated using (true);
create policy "developer insert own" on public.developers for insert to authenticated with check (user_id = auth.uid() and is_verified = false and is_suspended = false);
create policy "developer update own" on public.developers for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and is_verified = false and is_suspended = false);
create policy "developer admin" on public.developers for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger trg_dev_updated before update on public.developers for each row execute function public.update_updated_at_column();

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_description text not null,
  description text not null default '',
  icon_url text,
  category_id uuid references public.application_categories(id) on delete set null,
  developer_id uuid references public.developers(id) on delete set null,
  app_url text not null check (app_url ~ '^https://'),
  install_url text check (install_url is null or install_url ~ '^https://'),
  bridge_enabled boolean not null default false,
  website_url text,
  privacy_url text,
  version text not null default '1.0.0',
  platforms text[] not null default array['Android','iOS','Desktop'],
  features text[] not null default '{}',
  keywords text[] not null default '{}',
  is_free boolean not null default true,
  is_featured boolean not null default false,
  is_demo boolean not null default false,
  status app_status not null default 'draft',
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.applications(status);
create index on public.applications(category_id);
create index on public.applications(developer_id);
grant select on public.applications to anon, authenticated;
grant insert, update, delete on public.applications to authenticated;
grant all on public.applications to service_role;
alter table public.applications enable row level security;
create policy "apps public published" on public.applications for select to anon, authenticated using (status = 'published');
create policy "apps dev read own" on public.applications for select to authenticated using (developer_id in (select id from public.developers where user_id = auth.uid()));
create policy "apps dev insert own" on public.applications for insert to authenticated with check (status in ('draft','submitted') and is_featured = false and developer_id in (select id from public.developers where user_id = auth.uid() and is_suspended = false));
create policy "apps dev update own" on public.applications for update to authenticated using (status in ('draft','submitted','rejected') and developer_id in (select id from public.developers where user_id = auth.uid())) with check (status in ('draft','submitted') and is_featured = false and developer_id in (select id from public.developers where user_id = auth.uid()));
create policy "apps admin" on public.applications for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger trg_apps_updated before update on public.applications for each row execute function public.update_updated_at_column();

create table public.application_screenshots (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.application_screenshots to anon, authenticated;
grant insert, update, delete on public.application_screenshots to authenticated;
grant all on public.application_screenshots to service_role;
alter table public.application_screenshots enable row level security;
create policy "shots public" on public.application_screenshots for select to anon, authenticated using (exists(select 1 from public.applications a where a.id=application_id and a.status='published'));
create policy "shots admin" on public.application_screenshots for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.user_app_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  is_favourite boolean not null default false,
  install_state text not null default 'added' check (install_state in ('added','requested','confirmed')),
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, application_id)
);
grant select, insert, update, delete on public.user_app_library to authenticated;
grant all on public.user_app_library to service_role;
alter table public.user_app_library enable row level security;
create policy "library own" on public.user_app_library for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger trg_lib_updated before update on public.user_app_library for each row execute function public.update_updated_at_column();

create table public.installation_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('install_click','handoff_initiated','prompt_shown','install_accepted','install_dismissed','install_confirmed','app_opened')),
  platform text,
  browser text,
  created_at timestamptz not null default now()
);
create index on public.installation_events(application_id, event_type);
grant insert on public.installation_events to anon, authenticated;
grant select on public.installation_events to authenticated;
grant all on public.installation_events to service_role;
alter table public.installation_events enable row level security;
create policy "events insert" on public.installation_events for insert to anon, authenticated with check ((user_id is null or user_id = auth.uid()) and exists(select 1 from public.applications a where a.id=application_id and a.status='published'));
create policy "events admin read" on public.installation_events for select to authenticated using (public.is_admin(auth.uid()));

create table public.application_views (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on public.application_views(application_id);
grant insert on public.application_views to anon, authenticated;
grant select on public.application_views to authenticated;
grant all on public.application_views to service_role;
alter table public.application_views enable row level security;
create policy "views insert" on public.application_views for insert to anon, authenticated with check (exists(select 1 from public.applications a where a.id=application_id and a.status='published'));
create policy "views admin read" on public.application_views for select to authenticated using (public.is_admin(auth.uid()));

create table public.marketplace_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.marketplace_announcements to anon, authenticated;
grant insert, update, delete on public.marketplace_announcements to authenticated;
grant all on public.marketplace_announcements to service_role;
alter table public.marketplace_announcements enable row level security;
create policy "ann public" on public.marketplace_announcements for select to anon, authenticated using (is_active or public.is_admin(auth.uid()));
create policy "ann admin" on public.marketplace_announcements for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.application_reports (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 1000),
  created_at timestamptz not null default now()
);
grant insert, select on public.application_reports to authenticated;
grant all on public.application_reports to service_role;
alter table public.application_reports enable row level security;
create policy "report insert own" on public.application_reports for insert to authenticated with check (user_id = auth.uid());
create policy "report admin read" on public.application_reports for select to authenticated using (public.is_admin(auth.uid()));

insert into public.application_categories(slug,name,icon,sort_order) values
('business-finance','Business & Finance','Briefcase',1),
('productivity','Productivity','CheckSquare',2),
('education','Education','GraduationCap',3),
('health-lifestyle','Health & Lifestyle','HeartPulse',4),
('animals-agriculture','Animals & Agriculture','Sprout',5),
('transport-travel','Transport & Travel','Car',6),
('shopping-commerce','Shopping & Commerce','ShoppingBag',7),
('communication-social','Communication & Social','MessageCircle',8),
('entertainment','Entertainment','Clapperboard',9),
('utilities','Utilities','Wrench',10),
('community','Community','Users',11),
('other','Other Applications','LayoutGrid',12);

insert into public.developers(name, company, website, is_verified) values ('TankiSol','TankiSol / CodemathPHP','https://tankisol.com',true);

insert into public.applications(slug,name,short_description,description,category_id,developer_id,app_url,version,features,keywords,is_featured,is_demo,status)
select v.slug,v.name,v.sd,v.d,(select id from public.application_categories where slug=v.cat),(select id from public.developers where name='TankiSol'),v.url,'1.0.0',v.f,v.k,v.feat,true,'published'
from (values
 ('vetkonnect','VetKonnect','Connect with veterinarians and manage animal health.','VetKonnect links farmers and pet owners with veterinary professionals, appointments and animal health records.','animals-agriculture','https://app.vetkonnect.org',array['Find veterinarians','Book consultations','Animal health records'],array['vet','animals','farm'],true),
 ('vetkonnect-pos','VetKonnect POS','Point of sale for veterinary clinics and agri-stores.','A lightweight point-of-sale system built for veterinary practices and agricultural suppliers.','business-finance','https://pos.vetkonnect.org',array['Sales & receipts','Stock management','Daily reports'],array['pos','sales','inventory'],false),
 ('gokab','GoKab','Book local rides quickly and safely.','GoKab helps you request local transport and track your ride in real time.','transport-travel','https://gokab.app',array['Request rides','Live tracking','Trip history'],array['taxi','ride','transport'],true),
 ('zihomwe','Zihomwe','Community news, events and local connections.','Zihomwe brings communities together with local updates, events and groups.','community','https://zihomwe.app',array['Local news','Events','Groups'],array['community','events','social'],false)
) as v(slug,name,sd,d,cat,url,f,k,feat);
