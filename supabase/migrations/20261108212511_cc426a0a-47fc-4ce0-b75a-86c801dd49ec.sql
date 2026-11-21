revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.grant_super_admin() from public, anon, authenticated;
revoke execute on function public.guard_profile_suspension() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, app_role) from public, anon;
revoke execute on function public.is_admin(uuid) from public, anon;
grant execute on function public.has_role(uuid, app_role) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;