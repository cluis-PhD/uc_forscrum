import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronDown } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import {
  averageVelocity, burndownForSprint, currentSprint, sortSprints, velocityBySprint,
} from '../../data/sprintMetrics';

interface SprintChartsProps {
  sprints: any[];
  stories: any[];
  /** Cor principal (verde no formador, azul no formando). */
  color?: string;
}

const tooltipStyle = { borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '12px' };

/**
 * Gráficos por sprint com dados reais:
 * - Burndown do sprint escolhido;
 * - Velocidade (pontos planeados e concluídos) de todos os sprints.
 * Os pontos de cada user story vêm dos pontos definidos ou, na falta deles,
 * da média dos votos do Scrum Poker.
 */
export function SprintCharts({ sprints, stories, color = '#0a7da0' }: SprintChartsProps) {
  const ordered = useMemo(() => sortSprints(sprints), [sprints]);
  const [sprintId, setSprintId] = useState<string>('');

  // Escolher o sprint atual por omissão (ou quando a lista muda)
  useEffect(() => {
    if (!ordered.some((s) => s.id === sprintId)) {
      setSprintId(currentSprint(ordered)?.id || '');
    }
  }, [ordered]);

  const selected = ordered.find((s) => s.id === sprintId) || null;
  const burndown = useMemo(() => burndownForSprint(selected, stories), [selected, stories]);
  const velocity = useMemo(() => velocityBySprint(ordered, stories), [ordered, stories]);
  const avg = averageVelocity(velocity);
  const selectedIndex = ordered.findIndex((s) => s.id === sprintId);

  if (!ordered.length) {
    return (
      <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800 text-center text-[0.8125rem] text-slate-500 dark:text-slate-400">
        Ainda não há sprints para mostrar nos gráficos.
      </div>
    );
  }

  const finished = burndown.total > 0 && burndown.remaining === 0;

  return (
    <>
      {/* Escolha do sprint */}
      <div>
        <label htmlFor="sprint-chart-select" className="text-[0.75rem] text-slate-600 dark:text-slate-400 mb-2 block">
          Sprint
        </label>
        <div className="relative">
          <select
            id="sprint-chart-select"
            value={sprintId}
            onChange={(e) => setSprintId(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 rounded-[12px] px-3 py-2 text-[0.875rem] text-slate-800 appearance-none cursor-pointer pr-8 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          >
            {ordered.map((s, i) => (
              <option key={s.id} value={s.id}>
                S{i + 1} · {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Burndown do sprint escolhido */}
      <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-[1rem] text-slate-800 dark:text-slate-200">Burndown Chart</h2>
          <div className="bg-blue-100 px-3 py-1 rounded-[8px] dark:bg-blue-900/30">
            <p className="text-[0.6875rem] text-blue-700 dark:text-blue-400">S{selectedIndex + 1}</p>
          </div>
        </div>

        {burndown.total === 0 ? (
          <p className="text-center py-8 text-[0.8125rem] text-slate-500 dark:text-slate-400">
            Este sprint ainda não tem pontos estimados. Os pontos aparecem quando a equipa vota no Scrum Poker.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={burndown.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Ideal" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="real" stroke={color} strokeWidth={3} name="Real" dot={{ fill: color, r: 3 }} connectNulls={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}

        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-[0.75rem]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: color }}></div>
              <span className="text-slate-600 dark:text-slate-400">
                Trabalho restante: <strong className="text-slate-800 dark:text-slate-200">{burndown.remaining} de {burndown.total} pts</strong>
              </span>
            </div>
            {finished && <span className="text-green-600 dark:text-green-400">Concluído ✓</span>}
          </div>
        </div>
      </div>

      {/* Velocidade por sprint */}
      <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[1rem] text-slate-800 dark:text-slate-200">Velocidade por Sprint</h2>
          <BarChart3 style={{ color }} size={20} />
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={velocity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="sprint" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.nome || label}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="planeado" fill="#94a3b8" radius={[8, 8, 0, 0]} name="Planeado" isAnimationActive={false} />
            <Bar dataKey="concluido" fill={color} radius={[8, 8, 0, 0]} name="Concluído" isAnimationActive={false}>
              {velocity.map((v) => (
                <Cell key={v.id} fill={color} fillOpacity={v.id === `velocity-${sprintId}` ? 1 : 0.55} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-[0.75rem]">
            <span className="text-slate-600 dark:text-slate-400">Velocidade média</span>
            <strong className="text-[1rem]" style={{ color }}>{avg} pts</strong>
          </div>
          <p className="mt-2 text-[0.6875rem] text-slate-500 dark:text-slate-400">
            Pontos de cada user story: os definidos pelo formador ou, se não houver, a média dos votos do Scrum Poker (S = 3, M = 5, L = 8, XL = 13).
          </p>
        </div>
      </div>
    </>
  );
}
