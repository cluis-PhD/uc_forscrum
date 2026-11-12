/**
 * Camada de dados relacional (versão de teste).
 *
 * Intercepta os pedidos às rotas antigas (/functions/v1/make-server-1184b871/...)
 * e responde a partir das tabelas relacionais do Supabase (REST/PostgREST),
 * devolvendo exatamente o mesmo formato JSON que o servidor antigo.
 * Assim os componentes não precisam de mudar.
 *
 * Se as tabelas ainda não existirem (script SQL por correr), todos os pedidos
 * seguem para o servidor antigo, sem alterações.
 */
import { projectId, publicAnonKey } from '../utils/supabase/info';

const REST = `https://${projectId}.supabase.co/rest/v1`;
const ROUTE_MARK = '/functions/v1/make-server-1184b871';

type Json = Record<string, any>;
type Handled = { status: number; body: Json };

let nativeFetch: typeof fetch = (...a) => fetch(...a);
let relationalReady: Promise<boolean> | null = null;
let relationalOn = false;

export const isRelationalMode = () => relationalOn;

// ---------------------------------------------------------------- REST helpers

class RestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function rest(path: string, init: RequestInit = {}, prefer?: string): Promise<any> {
  const res = await nativeFetch(`${REST}/${path}`, {
    ...init,
    headers: {
      apikey: publicAnonKey,
      Authorization: `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new RestError(res.status, data?.message || data?.hint || res.statusText);
  return data;
}

const eq = (v: string) => `eq.${encodeURIComponent(v)}`;
const sel = (q: string) => rest(q);
const ins = (table: string, row: Json | Json[], prefer = 'return=representation') =>
  rest(table, { method: 'POST', body: JSON.stringify(row) }, prefer);
const upd = (table: string, filter: string, patch: Json) =>
  rest(`${table}?${filter}`, { method: 'PATCH', body: JSON.stringify(patch) }, 'return=representation');
const del = (table: string, filter: string) =>
  rest(`${table}?${filter}`, { method: 'DELETE' }, 'return=representation');

// ---------------------------------------------------------------- mapeamentos

/** campo da aplicação -> coluna da tabela */
const FIELDS: Record<string, Record<string, string>> = {
  courses: { name: 'name', description: 'description', status: 'status', startDate: 'start_date',
             endDate: 'end_date', progress: 'progress', studentsList: 'students_list' },
  teams: { name: 'name', members: 'members', courseId: 'course_id' },
  students: { name: 'name', email: 'email', courseId: 'course_id', teamId: 'team_id' },
  sprints: { name: 'name', goal: 'goal', startDate: 'start_date', endDate: 'end_date',
             courseId: 'course_id', teamId: 'team_id', status: 'status' },
  user_stories: { title: 'title', description: 'description', priority: 'priority', team: 'team',
                  acceptanceCriteria: 'acceptance_criteria', sprintId: 'sprint_id',
                  courseId: 'course_id', status: 'status', points: 'points' },
  alerts: { type: 'type', title: 'title', message: 'message', courseId: 'course_id', createdBy: 'created_by' },
};
/** campos calculados ou geridos pela base de dados: nunca guardados */
const DERIVED = new Set(['id', 'createdAt', 'updatedAt', 'students', 'teams', 'sprints', 'stories',
  'courseName', 'userStoryCount', 'totalStoryPoints', 'completionRate', 'votes', 'storyIds']);
const NULLABLE_FK = new Set(['team_id', 'sprint_id', 'course_id']);
const HAS_EXTRA = new Set(['courses', 'teams', 'students', 'sprints', 'user_stories']);

function toRow(table: string, body: Json, prevExtra: Json = {}): Json {
  const map = FIELDS[table];
  const row: Json = {};
  const extra: Json = { ...prevExtra };
  for (const [k, v] of Object.entries(body || {})) {
    if (DERIVED.has(k)) continue;
    const col = map[k];
    if (col) {
      let val = typeof v === 'string' && col !== 'students_list' ? v.trim() : v;
      if (NULLABLE_FK.has(col) && (val === '' || val === undefined)) val = null;
      if (col === 'points') val = Number(val) || 0;
      if (col === 'progress') val = Math.round(Number(val) || 0);
      row[col] = val;
    } else {
      extra[k] = v;
    }
  }
  if (HAS_EXTRA.has(table)) row.extra = extra;
  return row;
}

function fromRow(table: string, r: Json): Json {
  const map = FIELDS[table];
  const out: Json = { ...(r.extra || {}), id: r.id };
  for (const [k, col] of Object.entries(map)) {
    let v = r[col];
    if (NULLABLE_FK.has(col) && v == null && table !== 'alerts') v = '';
    if (col === 'points') v = Number(v) || 0;
    out[k] = v;
  }
  out.createdAt = r.created_at;
  if (r.updated_at) out.updatedAt = r.updated_at;
  return out;
}

const count = (embed: any) => (Array.isArray(embed) && embed[0]?.count) || 0;

const voteOut = (v: Json) => ({
  storyId: v.story_id, userId: v.user_id, userName: v.user_name,
  vote: v.vote != null && v.vote !== '' && !isNaN(Number(v.vote)) ? Number(v.vote) : v.vote,
  votingSystem: v.voting_system, timestamp: new Date(v.created_at).getTime(),
});

function courseOut(r: Json) {
  const c = fromRow('courses', r);
  const enrolled = count(r.students);
  c.students = enrolled || (Array.isArray(c.studentsList) ? c.studentsList.length : 0);
  c.teams = count(r.teams);
  c.sprints = count(r.sprints);
  return c;
}

function sprintOut(r: Json) {
  const s = fromRow('sprints', r);
  const stories: Json[] = r.user_stories || [];
  const done = stories.filter((x) => x.status === 'done').length;
  s.courseName = r.courses?.name || r.extra?.courseName || '';
  s.stories = stories.length;
  s.userStoryCount = stories.length;
  s.totalStoryPoints = stories.reduce((t, x) => t + (Number(x.points) || 0), 0);
  s.completionRate = stories.length ? Math.round((done / stories.length) * 100) : 0;
  return s;
}

function storyOut(r: Json) {
  const s = fromRow('user_stories', r);
  s.votes = (r.votes || []).map(voteOut);
  return s;
}

function alertOut(r: Json) {
  const a = fromRow('alerts', r);
  a.courseId = r.course_id || undefined;
  a.courseName = r.courses?.name || undefined;
  return a;
}

const COURSE_SEL = 'select=*,students(count),teams(count),sprints(count)';
const SPRINT_SEL = 'select=*,courses(name),user_stories(id,points,status)';
const STORY_SEL = 'select=*,votes(*)';
const ALERT_SEL = 'select=*,courses(name)';
const ORDER = 'order=created_at.desc';

const newId = (prefix: string) => `${prefix}${Date.now()}`;
const ok = (body: Json, status = 200): Handled => ({ status, body: { success: true, ...body } });
const fail = (status: number, error: string): Handled => ({ status, body: { error } });

async function one(table: string, id: string, select = 'select=*') {
  const rows = await sel(`${table}?${select}&id=${eq(id)}`);
  return rows?.[0] || null;
}

async function replaceVotes(storyId: string, votes: Json[]) {
  await del('votes', `story_id=${eq(storyId)}`);
  const rows = votes
    .filter((v) => v && (v.userId || v.userName))
    .map((v) => ({ story_id: storyId, user_id: String(v.userId || v.userName), user_name: v.userName || '',
                   vote: v.vote == null ? null : String(v.vote), voting_system: v.votingSystem || 'fibonacci' }));
  if (rows.length) await ins('votes?on_conflict=story_id,user_id', rows, 'return=minimal,resolution=merge-duplicates');
}

// ---------------------------------------------------------------- rotas

async function route(method: string, parts: string[], q: URLSearchParams, body: Json): Promise<Handled | null> {
  const [res, id, sub] = parts;

  switch (res) {
    case 'health':
      return { status: 200, body: { status: 'ok', mode: 'relacional' } };

    // ---- cursos
    case 'courses': {
      if (!id && method === 'GET')
        return ok({ courses: (await sel(`courses?${COURSE_SEL}&${ORDER}`)).map(courseOut) });
      if (!id && method === 'POST') {
        if (!body.name?.trim()) return fail(400, 'Nome do curso é obrigatório');
        const list = (body.studentsList || []).filter((e: string) => e?.trim());
        const row = toRow('courses', {
          status: 'new', startDate: new Date().toLocaleDateString('pt-PT'), endDate: '', progress: 0,
          ...body, studentsList: list,
        });
        const [r] = await ins('courses', { id: Date.now().toString(), ...row });
        return ok({ course: courseOut(r) }, 201);
      }
      if (id && method === 'GET') {
        const r = await one('courses', id, COURSE_SEL);
        return r ? ok({ course: courseOut(r) }) : fail(404, 'Curso não encontrado');
      }
      if (id && method === 'PUT') {
        const prev = await one('courses', id);
        if (!prev) return fail(404, 'Curso não encontrado');
        await upd('courses', `id=${eq(id)}`, toRow('courses', body, prev.extra));
        return ok({ course: courseOut(await one('courses', id, COURSE_SEL)) });
      }
      if (id && method === 'DELETE') {
        const rows = await del('courses', `id=${eq(id)}`);
        return rows?.length ? ok({ message: 'Curso apagado com sucesso' }) : fail(404, 'Curso não encontrado');
      }
      break;
    }

    // ---- sprints
    case 'sprints': {
      if (!id && method === 'GET') {
        const f = q.get('courseId') ? `&course_id=${eq(q.get('courseId')!)}` : '';
        return ok({ sprints: (await sel(`sprints?${SPRINT_SEL}${f}&${ORDER}`)).map(sprintOut) });
      }
      if (!id && method === 'POST') {
        if (!body.name?.trim()) return fail(400, 'Nome do sprint é obrigatório');
        if (!body.courseId) return fail(400, 'ID do curso é obrigatório');
        const row = toRow('sprints', { status: 'planning', ...body });
        const sid = newId('sprint_');
        await ins('sprints', { id: sid, ...row });
        return ok({ sprint: sprintOut(await one('sprints', sid, SPRINT_SEL)) }, 201);
      }
      if (id && method === 'GET') {
        const r = await one('sprints', id, SPRINT_SEL);
        return r ? ok({ sprint: sprintOut(r) }) : fail(404, 'Sprint não encontrado');
      }
      if (id && method === 'PUT') {
        const prev = await one('sprints', id);
        if (!prev) return fail(404, 'Sprint não encontrado');
        const patch = { ...body };
        if (!patch.courseId) delete patch.courseId;
        await upd('sprints', `id=${eq(id)}`, toRow('sprints', patch, prev.extra));
        return ok({ sprint: sprintOut(await one('sprints', id, SPRINT_SEL)) });
      }
      if (id && method === 'DELETE') {
        const rows = await del('sprints', `id=${eq(id)}`);
        return rows?.length ? ok({ message: 'Sprint apagado com sucesso' }) : fail(404, 'Sprint não encontrado');
      }
      break;
    }

    // ---- associação de user stories a um sprint
    case 'sprint-stories': {
      if (!id) break;
      if (method === 'GET') {
        const rows = await sel(`user_stories?select=id&sprint_id=${eq(id)}`);
        return ok({ storyIds: rows.map((r: Json) => r.id) });
      }
      if (method === 'PUT') {
        const ids: string[] = Array.isArray(body.storyIds) ? body.storyIds : [];
        const current: string[] = (await sel(`user_stories?select=id&sprint_id=${eq(id)}`)).map((r: Json) => r.id);
        const remove = current.filter((x) => !ids.includes(x));
        if (remove.length) await upd('user_stories', `id=in.(${remove.map(encodeURIComponent).join(',')})`, { sprint_id: null });
        if (ids.length) await upd('user_stories', `id=in.(${ids.map(encodeURIComponent).join(',')})`, { sprint_id: id });
        return ok({ storyIds: ids });
      }
      break;
    }

    // ---- user stories
    case 'stories': {
      if (!id && method === 'GET') {
        let f = '';
        if (q.get('sprintId')) f += `&sprint_id=${eq(q.get('sprintId')!)}`;
        if (q.get('courseId')) f += `&course_id=${eq(q.get('courseId')!)}`;
        return ok({ stories: (await sel(`user_stories?${STORY_SEL}${f}&${ORDER}`)).map(storyOut) });
      }
      if (!id && method === 'POST') {
        if (!body.title?.trim()) return fail(400, 'Título é obrigatório');
        if (!body.courseId) return fail(400, 'Curso é obrigatório');
        const sid = newId('story_');
        await ins('user_stories', { id: sid, ...toRow('user_stories', { priority: 'medium', status: 'backlog', points: 0, ...body }) });
        if (Array.isArray(body.votes)) await replaceVotes(sid, body.votes);
        return ok({ userStory: storyOut(await one('user_stories', sid, STORY_SEL)) }, 201);
      }
      if (id && method === 'GET') {
        const r = await one('user_stories', id, STORY_SEL);
        return r ? ok({ story: storyOut(r) }) : fail(404, 'User story não encontrada');
      }
      if (id && method === 'PUT') {
        const prev = await one('user_stories', id);
        if (!prev) return fail(404, 'User story não encontrada');
        const patch = { ...body };
        if (!patch.courseId) delete patch.courseId;
        await upd('user_stories', `id=${eq(id)}`, toRow('user_stories', patch, prev.extra));
        if (Array.isArray(body.votes)) await replaceVotes(id, body.votes);
        return ok({ story: storyOut(await one('user_stories', id, STORY_SEL)) });
      }
      if (id && method === 'DELETE') {
        const rows = await del('user_stories', `id=${eq(id)}`);
        return rows?.length ? ok({ message: 'User story apagada com sucesso' }) : fail(404, 'User story não encontrada');
      }
      break;
    }

    // ---- equipas
    case 'teams': {
      if (!id && method === 'GET') {
        const f = q.get('courseId') ? `&course_id=${eq(q.get('courseId')!)}` : '';
        return ok({ teams: (await sel(`teams?select=*${f}&${ORDER}`)).map((r: Json) => fromRow('teams', r)) });
      }
      if (!id && method === 'POST') {
        if (!body.name?.trim()) return fail(400, 'Nome da equipa é obrigatório');
        if (!body.courseId) return fail(400, 'Curso obrigatório');
        const [r] = await ins('teams', { id: newId('team_'), ...toRow('teams', { members: [], ...body }) });
        return ok({ team: fromRow('teams', r) }, 201);
      }
      if (id && method === 'GET') {
        const r = await one('teams', id);
        return r ? ok({ team: fromRow('teams', r) }) : fail(404, 'Equipa não encontrada');
      }
      if (id && method === 'PUT') {
        const prev = await one('teams', id);
        if (!prev) return fail(404, 'Equipa não encontrada');
        const patch = { ...body };
        if (!patch.name?.trim()) delete patch.name;
        if (!patch.courseId) delete patch.courseId;
        const [r] = await upd('teams', `id=${eq(id)}`, toRow('teams', patch, prev.extra));
        return ok({ team: fromRow('teams', r) });
      }
      if (id && method === 'DELETE') {
        const rows = await del('teams', `id=${eq(id)}`);
        return rows?.length ? ok({ message: 'Equipa apagada com sucesso' }) : fail(404, 'Equipa não encontrada');
      }
      break;
    }

    // ---- formandos
    case 'students': {
      if (!id && method === 'GET') {
        const f = q.get('courseId') ? `&course_id=${eq(q.get('courseId')!)}` : '';
        return ok({ students: (await sel(`students?select=*${f}&${ORDER}`)).map((r: Json) => fromRow('students', r)) });
      }
      if ((!id && method === 'POST') || (id && sub === 'sync' && method === 'POST')) {
        if (!body.name?.trim()) return fail(400, 'Nome do formando é obrigatório');
        if (!body.courseId?.trim?.()) return fail(400, 'Curso do formando é obrigatório');
        const sid = (sub === 'sync' ? id : body.id?.trim?.()) || newId('student_');
        const [r] = await ins('students', { id: sid, ...toRow('students', body) },
          'return=representation,resolution=merge-duplicates');
        return ok({ student: fromRow('students', r) }, 201);
      }
      if (id && method === 'GET') {
        const r = await one('students', id);
        return r ? ok({ student: fromRow('students', r) }) : fail(404, 'Formando não encontrado');
      }
      if (id && method === 'PUT') {
        const prev = await one('students', id);
        if (!prev) return fail(404, 'Formando não encontrado');
        const patch = { ...body };
        if (!patch.courseId) delete patch.courseId;
        const [r] = await upd('students', `id=${eq(id)}`, toRow('students', patch, prev.extra));
        return ok({ student: fromRow('students', r) });
      }
      if (id && method === 'DELETE') {
        const rows = await del('students', `id=${eq(id)}`);
        return rows?.length ? ok({ message: 'Formando apagado com sucesso' }) : fail(404, 'Formando não encontrado');
      }
      break;
    }

    // ---- votos (Scrum Poker)
    case 'votes': {
      const storyId = q.get('storyId') || body.storyId || id;
      if (!storyId) return fail(400, 'storyId é obrigatório');
      if (method === 'GET')
        return ok({ votes: (await sel(`votes?select=*&story_id=${eq(storyId)}&order=created_at`)).map(voteOut) });
      if (method === 'POST') {
        const userId = String(body.userId || body.userName || '');
        if (!userId) return fail(400, 'userId é obrigatório');
        await ins('votes?on_conflict=story_id,user_id', { story_id: storyId, user_id: userId, user_name: body.userName || '',
          vote: body.vote == null ? null : String(body.vote), voting_system: body.votingSystem || 'fibonacci' },
          'return=minimal,resolution=merge-duplicates');
        return ok({});
      }
      if (method === 'DELETE') {
        await del('votes', `story_id=${eq(storyId)}`);
        return ok({});
      }
      break;
    }

    // ---- alertas
    case 'alerts': {
      if (!id && method === 'GET') {
        const f = q.get('courseId') ? `&or=(course_id.is.null,course_id.eq.${encodeURIComponent(q.get('courseId')!)})` : '';
        return ok({ alerts: (await sel(`alerts?${ALERT_SEL}${f}&${ORDER}`)).map(alertOut) });
      }
      if (!id && method === 'POST') {
        if (!body.title?.trim()) return fail(400, 'Título é obrigatório');
        const aid = newId('alert_');
        await ins('alerts', { id: aid, ...toRow('alerts', { type: 'warning', createdBy: 'Formador', ...body }) });
        return ok({ alert: alertOut(await one('alerts', aid, ALERT_SEL)) }, 201);
      }
      if (id && method === 'PUT') {
        const rows = await upd('alerts', `id=${eq(id)}`, toRow('alerts', body));
        if (!rows?.length) return fail(404, 'Alerta não encontrado');
        return ok({ alert: alertOut(await one('alerts', id, ALERT_SEL)) });
      }
      if (id && method === 'DELETE') {
        const rows = await del('alerts', `id=${eq(id)}`);
        return rows?.length ? ok({ message: 'Alerta apagado' }) : fail(404, 'Alerta não encontrado');
      }
      break;
    }
  }
  return null; // rota desconhecida: segue para o servidor antigo
}

// ---------------------------------------------------------------- instalação

function checkTables(): Promise<boolean> {
  if (!relationalReady) {
    relationalReady = rest('courses?select=id&limit=1')
      .then(() => true)
      .catch(() => false)
      .then((on) => {
        relationalOn = on;
        console.log(on
          ? '[MyforScrum] 🗄️ Base de dados relacional ativa'
          : '[MyforScrum] ℹ️ Tabelas relacionais não encontradas: a usar o servidor antigo');
        return on;
      });
  }
  return relationalReady;
}

export function installRelationalApi() {
  if ((window as any).__forscrumRelational) return;
  (window as any).__forscrumRelational = true;
  nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const at = url.indexOf(ROUTE_MARK);
    if (at === -1 || !(await checkTables())) return nativeFetch(input as any, init);

    const u = new URL(url);
    const parts = u.pathname.slice(u.pathname.indexOf(ROUTE_MARK) + ROUTE_MARK.length)
      .split('/').filter(Boolean).map(decodeURIComponent);
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    let body: Json = {};
    if (init?.body && typeof init.body === 'string') {
      try { body = JSON.parse(init.body); } catch { /* corpo não JSON */ }
    }

    try {
      const handled = await route(method, parts, u.searchParams, body);
      if (!handled) return nativeFetch(input as any, init);
      return new Response(JSON.stringify(handled.body), {
        status: handled.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      console.error('[MyforScrum] ❌ Erro na base de dados:', e);
      const status = e instanceof RestError && e.status >= 400 && e.status < 500 ? 400 : 500;
      return new Response(JSON.stringify({ error: e?.message || 'Erro na base de dados' }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };

  checkTables();
}
