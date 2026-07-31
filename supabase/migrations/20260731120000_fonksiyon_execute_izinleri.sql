-- Fix: "permission denied for function is_admin" for anonymous visitors.
--
-- The courses / yorumlar / referanslar select policies call is_admin() (and
-- is_enrolled()) as part of their USING expression. Postgres evaluates the
-- whole expression, so a role without EXECUTE on those functions cannot read
-- the table *at all* — not even the rows the public branch of the policy would
-- have allowed. That is why published courses were invisible to the site while
-- the admin panel listed them fine.
--
-- Both functions are SECURITY DEFINER and only report something about the
-- current caller, returning false for anonymous sessions, so exposing them to
-- anon is safe.

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_enrolled(uuid) to anon, authenticated;
