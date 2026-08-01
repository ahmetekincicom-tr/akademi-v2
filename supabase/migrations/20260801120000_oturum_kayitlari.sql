-- Login history, kept for account security and shared-credential detection.
--
-- Scope is deliberately narrow, because IP and location are personal data
-- under KVKK and every extra field is a liability rather than an asset:
--   * one row per sign-in, not per request or per page view
--   * parsed browser / OS / device only — the raw User-Agent string is not kept
--   * rows older than 90 days are deleted on every write, so the table never
--     accumulates history nobody asked for
--
-- A student sees their own rows in /panel/hesabim; an admin sees everyone's,
-- which is what makes one account used from four cities visible.

create table oturum_kayitlari (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  ip inet,
  ulke text,
  sehir text,
  bolge text,
  tarayici text,
  isletim_sistemi text,
  cihaz text,
  created_at timestamptz not null default now()
);

create index oturum_kayitlari_user_idx on oturum_kayitlari(user_id, created_at desc);
create index oturum_kayitlari_created_idx on oturum_kayitlari(created_at);

alter table oturum_kayitlari enable row level security;

create policy oturum_select_own_or_admin on public.oturum_kayitlari
  for select using (user_id = auth.uid() or public.is_admin());

-- No insert, update or delete policy on purpose. The only writer is the
-- definer function below, so nobody can erase their own trail — the property
-- that makes this log worth keeping at all.
--
-- Known limit: a determined user could call the function directly and add a
-- row with an IP of their choosing. They still cannot delete or alter the real
-- entries, and user_id always comes from auth.uid(), so they can only add noise
-- to their own history — never remove evidence or touch anyone else's.

create or replace function public.oturum_kaydet(
  p_ip text default null,
  p_ulke text default null,
  p_sehir text default null,
  p_bolge text default null,
  p_tarayici text default null,
  p_isletim_sistemi text default null,
  p_cihaz text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ip inet;
begin
  if v_user is null then
    raise exception 'Oturum bulunamadı';
  end if;

  begin
    v_ip := nullif(btrim(coalesce(p_ip, '')), '')::inet;
  exception when others then
    v_ip := null;
  end;

  -- Aynı cihaz ve IP'den yarım saat içinde tekrar giriş yapılırsa yeni satır
  -- açma: sekme yenilemeleri listeyi doldurmasın.
  if exists (
    select 1 from oturum_kayitlari
    where user_id = v_user
      and created_at > now() - interval '30 minutes'
      and ip is not distinct from v_ip
      and tarayici is not distinct from nullif(btrim(coalesce(p_tarayici, '')), '')
  ) then
    return;
  end if;

  insert into oturum_kayitlari (
    user_id, ip, ulke, sehir, bolge, tarayici, isletim_sistemi, cihaz
  )
  values (
    v_user,
    v_ip,
    nullif(btrim(coalesce(p_ulke, '')), ''),
    nullif(btrim(coalesce(p_sehir, '')), ''),
    nullif(btrim(coalesce(p_bolge, '')), ''),
    nullif(btrim(coalesce(p_tarayici, '')), ''),
    nullif(btrim(coalesce(p_isletim_sistemi, '')), ''),
    nullif(btrim(coalesce(p_cihaz, '')), '')
  );

  -- Saklama süresi burada uygulanır; ayrı bir zamanlanmış göreve ihtiyaç yok.
  delete from oturum_kayitlari where created_at < now() - interval '90 days';
end;
$$;

revoke execute on function public.oturum_kaydet(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.oturum_kaydet(text, text, text, text, text, text, text) to authenticated;
