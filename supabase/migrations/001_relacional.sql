-- =====================================================================
-- MyforScrum: modelo relacional (versão de teste)
-- Executar UMA vez no Supabase: Dashboard > SQL Editor > New query > Run
--
-- Não apaga nada: a tabela antiga kv_store_1184b871 fica intacta e o
-- site em produção continua a usá-la. Os dados são COPIADOS para as
-- novas tabelas. Pode voltar a correr o script sem duplicar dados.
-- =====================================================================

-- ---------- 1. Tabelas ----------------------------------------------

create table if not exists public.courses (
  id            text primary key,
  name          text not null,
  description   text not null default '',
  status        text not null default 'new',
  start_date    text not null default '',
  end_date      text not null default '',
  progress      integer not null default 0,
  students_list jsonb not null default '[]'::jsonb,
  extra         jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

create table if not exists public.teams (
  id          text primary key,
  course_id   text not null references public.courses(id) on delete cascade,
  name        text not null,
  members     jsonb not null default '[]'::jsonb,
  extra       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create table if not exists public.students (
  id          text primary key,
  course_id   text not null references public.courses(id) on delete cascade,
  team_id     text references public.teams(id) on delete set null,
  name        text not null,
  email       text not null default '',
  extra       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create table if not exists public.sprints (
  id          text primary key,
  course_id   text not null references public.courses(id) on delete cascade,
  team_id     text references public.teams(id) on delete set null,
  name        text not null,
  goal        text not null default '',
  start_date  text not null default '',
  end_date    text not null default '',
  status      text not null default 'planning',
  extra       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create table if not exists public.user_stories (
  id                  text primary key,
  course_id           text not null references public.courses(id) on delete cascade,
  sprint_id           text references public.sprints(id) on delete cascade,
  title               text not null,
  description         text not null default '',
  priority            text not null default 'medium',
  team                text not null default '',
  acceptance_criteria jsonb not null default '[]'::jsonb,
  status              text not null default 'backlog',
  points              numeric not null default 0,
  extra               jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz
);

create table if not exists public.votes (
  id            bigint generated always as identity primary key,
  story_id      text not null references public.user_stories(id) on delete cascade,
  user_id       text not null,
  user_name     text not null default '',
  vote          text,
  voting_system text not null default 'fibonacci',
  created_at    timestamptz not null default now(),
  unique (story_id, user_id)
);

create table if not exists public.alerts (
  id          text primary key,
  course_id   text references public.courses(id) on delete cascade,
  type        text not null default 'warning',
  title       text not null,
  message     text not null default '',
  created_by  text not null default 'Formador',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create index if not exists teams_course_idx    on public.teams(course_id);
create index if not exists students_course_idx on public.students(course_id);
create index if not exists students_team_idx   on public.students(team_id);
create index if not exists sprints_course_idx  on public.sprints(course_id);
create index if not exists stories_sprint_idx  on public.user_stories(sprint_id);
create index if not exists stories_course_idx  on public.user_stories(course_id);
create index if not exists votes_story_idx     on public.votes(story_id);
create index if not exists alerts_course_idx   on public.alerts(course_id);

-- ---------- 2. Data de atualização automática -----------------------

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['courses','teams','students','sprints','user_stories','alerts'] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$s
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------- 3. Acesso (protótipo) -----------------------------------
-- Protótipo sem autenticação: a chave pública (anon) pode ler e escrever.
-- Antes de uso real, substituir por políticas com Supabase Auth.

do $$
declare t text;
begin
  foreach t in array array['courses','teams','students','sprints','user_stories','votes','alerts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists prototipo_acesso_total on public.%I', t);
    execute format('create policy prototipo_acesso_total on public.%I
                    for all to anon, authenticated using (true) with check (true)', t);
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
  end loop;
end $$;
grant usage on all sequences in schema public to anon, authenticated;

-- ---------- 4. Cópia dos dados antigos (kv_store) -------------------
-- Só copia registos cujo "pai" existe (ex.: equipa de um curso apagado
-- fica de fora). "on conflict do nothing" evita duplicados.

insert into public.courses (id, name, description, status, start_date, end_date, progress, students_list, created_at)
select v->>'id', coalesce(nullif(v->>'name',''),'(sem nome)'), coalesce(v->>'description',''),
       coalesce(v->>'status','new'), coalesce(v->>'startDate',''), coalesce(v->>'endDate',''),
       coalesce(nullif(v->>'progress','')::numeric,0)::int,
       case when jsonb_typeof(v->'studentsList')='array' then v->'studentsList' else '[]'::jsonb end,
       coalesce(nullif(v->>'createdAt','')::timestamptz, now())
from (select value v from public.kv_store_1184b871 where key like 'course:%') s
where v->>'id' is not null
on conflict (id) do nothing;

insert into public.teams (id, course_id, name, members, created_at)
select v->>'id', v->>'courseId', coalesce(nullif(v->>'name',''),'(sem nome)'),
       case when jsonb_typeof(v->'members')='array' then v->'members' else '[]'::jsonb end,
       coalesce(nullif(v->>'createdAt','')::timestamptz, now())
from (select value v from public.kv_store_1184b871 where key like 'team:%') s
where exists (select 1 from public.courses c where c.id = v->>'courseId')
on conflict (id) do nothing;

insert into public.students (id, course_id, team_id, name, email, created_at)
select v->>'id', v->>'courseId',
       (select t.id from public.teams t where t.id = nullif(v->>'teamId','')),
       coalesce(nullif(v->>'name',''),'(sem nome)'), coalesce(v->>'email',''),
       coalesce(nullif(v->>'createdAt','')::timestamptz, now())
from (select value v from public.kv_store_1184b871 where key like 'student:%') s
where exists (select 1 from public.courses c where c.id = v->>'courseId')
on conflict (id) do nothing;

insert into public.sprints (id, course_id, team_id, name, goal, start_date, end_date, status, created_at)
select v->>'id', v->>'courseId',
       (select t.id from public.teams t where t.id = nullif(v->>'teamId','')),
       coalesce(nullif(v->>'name',''),'(sem nome)'), coalesce(v->>'goal',''),
       coalesce(v->>'startDate',''), coalesce(v->>'endDate',''), coalesce(v->>'status','planning'),
       coalesce(nullif(v->>'createdAt','')::timestamptz, now())
from (select value v from public.kv_store_1184b871 where key like 'sprint:%') s
where exists (select 1 from public.courses c where c.id = v->>'courseId')
on conflict (id) do nothing;

insert into public.user_stories (id, course_id, sprint_id, title, description, priority, team,
                                 acceptance_criteria, status, points, created_at)
select v->>'id', v->>'courseId',
       (select sp.id from public.sprints sp where sp.id = nullif(v->>'sprintId','')),
       coalesce(nullif(v->>'title',''),'(sem título)'), coalesce(v->>'description',''),
       coalesce(v->>'priority','medium'), coalesce(v->>'team',''),
       case when jsonb_typeof(v->'acceptanceCriteria')='array' then v->'acceptanceCriteria' else '[]'::jsonb end,
       coalesce(v->>'status','backlog'),
       coalesce(nullif(regexp_replace(coalesce(v->>'points',''),'[^0-9.]','','g'),'')::numeric,0),
       coalesce(nullif(v->>'createdAt','')::timestamptz, now())
from (select value v from public.kv_store_1184b871 where key like 'story:%') s
where exists (select 1 from public.courses c where c.id = v->>'courseId')
on conflict (id) do nothing;

insert into public.votes (story_id, user_id, user_name, vote, voting_system, created_at)
select s.id, coalesce(e->>'userId', e->>'userName'), coalesce(e->>'userName',''), e->>'vote',
       coalesce(e->>'votingSystem','fibonacci'), now()
from public.kv_store_1184b871 k
join public.user_stories s on k.key = 'story:' || s.id
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(k.value->'votes')='array' then k.value->'votes' else '[]'::jsonb end) e
where coalesce(e->>'userId', e->>'userName') is not null
on conflict (story_id, user_id) do nothing;

-- ---------- 5. Resumo -----------------------------------------------
select 'courses' tabela, count(*) from public.courses
union all select 'teams', count(*) from public.teams
union all select 'students', count(*) from public.students
union all select 'sprints', count(*) from public.sprints
union all select 'user_stories', count(*) from public.user_stories
union all select 'votes', count(*) from public.votes
union all select 'alerts', count(*) from public.alerts;
