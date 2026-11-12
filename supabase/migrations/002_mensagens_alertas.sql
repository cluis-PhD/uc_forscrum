-- =====================================================================
-- MyforScrum: mensagens e leitura de alertas
-- Executar UMA vez no projeto malixbxxfqzzszvjyrla:
-- Dashboard > SQL Editor > New query > colar > Run
-- Não apaga nada. Pode ser executado mais de uma vez.
-- =====================================================================

-- Mensagens entre o formador e cada formando
create table if not exists public.messages (
  id            text primary key,
  student_id    text not null references public.students(id) on delete cascade,
  student_name  text not null default '',
  trainer_name  text not null default 'Formador',
  title         text not null,
  message       text not null,
  sent_by       text not null default 'formador' check (sent_by in ('formador','formando')),
  is_read       boolean not null default false,
  edited_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);
alter table public.messages add column if not exists edited_at timestamptz;
create index if not exists messages_student_idx on public.messages(student_id);

-- Que alertas cada pessoa já leu (reader_id = id do formando ou 'formador')
create table if not exists public.alert_reads (
  alert_id   text not null references public.alerts(id) on delete cascade,
  reader_id  text not null,
  read_at    timestamptz not null default now(),
  primary key (alert_id, reader_id)
);

drop trigger if exists trg_messages_updated on public.messages;
create trigger trg_messages_updated before update on public.messages
  for each row execute function public.set_updated_at();

do $$
declare t text;
begin
  foreach t in array array['messages','alert_reads'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists prototipo_acesso_total on public.%I', t);
    execute format('create policy prototipo_acesso_total on public.%I
                    for all to anon, authenticated using (true) with check (true)', t);
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
  end loop;
end $$;

notify pgrst, 'reload schema';

select 'messages' tabela, count(*) from public.messages
union all select 'alert_reads', count(*) from public.alert_reads;
