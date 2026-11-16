/**
 * Métricas de sprint calculadas a partir dos dados reais:
 * user stories, estado (done) e votos do Scrum Poker.
 */

/** Conversão dos tamanhos T-Shirt em story points. */
export const TSHIRT_POINTS: Record<string, number> = {
  XXS: 1, XS: 2, S: 3, M: 5, L: 8, XL: 13, XXL: 21,
};

/** Valor de um voto em pontos (T-Shirt ou número); null se não for estimativa ('?', '☕'). */
export function voteToPoints(vote: unknown): number | null {
  if (vote == null || vote === '') return null;
  const key = String(vote).trim().toUpperCase();
  if (key in TSHIRT_POINTS) return TSHIRT_POINTS[key];
  const n = Number(vote);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Média dos votos de uma story, em pontos (0 se não houver votos válidos). */
export function votesAverage(story: any): number {
  const values = (Array.isArray(story?.votes) ? story.votes : [])
    .map((v: any) => voteToPoints(v.vote ?? v.value))
    .filter((v: number | null): v is number => v != null);
  if (!values.length) return 0;
  return Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length);
}

/** Pontos de uma story: os pontos definidos ou, se não houver, a média dos votos. */
export function storyPoints(story: any): number {
  const fixed = Number(story?.points) || 0;
  return fixed > 0 ? fixed : votesAverage(story);
}

const isDone = (story: any) => story?.status === 'done';

/** Lê datas "aaaa-mm-dd", "dd/mm/aaaa" ou ISO completas. */
export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const s = String(value).trim();
  const pt = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (pt) return new Date(Number(pt[3]), Number(pt[2]) - 1, Number(pt[1]));
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const DAY = 24 * 60 * 60 * 1000;

/** Ordena sprints pela data de início (ou de criação). */
export function sortSprints<T extends { startDate?: string; createdAt?: string }>(sprints: T[]): T[] {
  const key = (s: T) => (parseDate(s.startDate) || parseDate(s.createdAt) || new Date(0)).getTime();
  return [...sprints].sort((a, b) => key(a) - key(b));
}

/** Sprint "atual": o que inclui hoje; senão o próximo; senão o último. */
export function currentSprint<T extends { startDate?: string; endDate?: string; createdAt?: string }>(sprints: T[]): T | null {
  const ordered = sortSprints(sprints);
  if (!ordered.length) return null;
  const today = startOfDay(new Date()).getTime();
  const running = ordered.find((s) => {
    const a = parseDate(s.startDate)?.getTime();
    const b = parseDate(s.endDate)?.getTime();
    return a != null && b != null && a <= today && today <= b;
  });
  if (running) return running;
  const next = ordered.find((s) => (parseDate(s.startDate)?.getTime() ?? -1) > today);
  return next || ordered[ordered.length - 1];
}

export interface VelocityPoint {
  id: string;
  sprint: string;
  nome: string;
  planeado: number;
  concluido: number;
}

/** Velocidade por sprint: pontos planeados e concluídos. */
export function velocityBySprint(sprints: any[], stories: any[]): VelocityPoint[] {
  return sortSprints(sprints).map((sprint, i) => {
    const own = stories.filter((st) => st.sprintId === sprint.id);
    return {
      id: `velocity-${sprint.id}`,
      sprint: `S${i + 1}`,
      nome: sprint.name,
      planeado: own.reduce((t, st) => t + storyPoints(st), 0),
      concluido: own.filter(isDone).reduce((t, st) => t + storyPoints(st), 0),
    };
  });
}

/** Velocidade média: média dos pontos concluídos nos sprints com trabalho planeado. */
export function averageVelocity(data: VelocityPoint[]): number {
  const withWork = data.filter((d) => d.planeado > 0);
  if (!withWork.length) return 0;
  return Math.round(withWork.reduce((t, d) => t + d.concluido, 0) / withWork.length);
}

export interface BurndownPoint {
  id: string;
  day: string;
  ideal: number;
  real: number | null;
}

/**
 * Burndown de um sprint, dia a dia, entre a data de início e a de fim.
 * "Real" usa a data em que cada story foi marcada como concluída
 * (última atualização da story) e só é desenhado até hoje.
 */
export function burndownForSprint(sprint: any, stories: any[]): { data: BurndownPoint[]; total: number; remaining: number } {
  const own = stories.filter((st) => st.sprintId === sprint?.id);
  const total = own.reduce((t, st) => t + storyPoints(st), 0);
  const done = own.filter(isDone);
  const remaining = total - done.reduce((t, st) => t + storyPoints(st), 0);
  if (!sprint) return { data: [], total, remaining };

  const start = startOfDay(parseDate(sprint.startDate) || parseDate(sprint.createdAt) || new Date());
  let end = startOfDay(parseDate(sprint.endDate) || new Date(start.getTime() + 6 * DAY));
  if (end < start) end = start;
  const days = Math.min(Math.round((end.getTime() - start.getTime()) / DAY) + 1, 31);
  const today = startOfDay(new Date()).getTime();

  const data: BurndownPoint[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(start.getTime() + i * DAY);
    const endOfDay = day.getTime() + DAY - 1;
    const ideal = days > 1 ? total - (total * i) / (days - 1) : 0;
    const doneByDay = done
      .filter((st) => (parseDate(st.updatedAt) || parseDate(st.createdAt) || new Date(0)).getTime() <= endOfDay)
      .reduce((t, st) => t + storyPoints(st), 0);
    data.push({
      id: `burndown-${sprint.id}-${i}`,
      day: day.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
      ideal: Math.max(0, Math.round(ideal)),
      real: day.getTime() <= today ? Math.max(0, total - doneByDay) : null,
    });
  }
  return { data, total, remaining };
}
