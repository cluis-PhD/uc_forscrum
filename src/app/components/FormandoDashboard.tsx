import { useState, useEffect, useMemo } from 'react';
import { BookOpen, MessageSquare, Bell, Calendar, User, ListTodo, Mail, Award, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mockAPI } from '../utils/supabase/mock-api';
import { useApp } from '../context/AppContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Header } from './shared/Header';

interface FormandoDashboardProps {
  onLogout: () => void;
  onNavigate?: (screen: string) => void;
}

export function FormandoDashboard({ onLogout, onNavigate }: FormandoDashboardProps) {
  const { unreadMessages, unreadAlerts, userProfile, loggedStudent, setSelectedUserStory } = useApp();

  // Estados para dados dinâmicos do backend
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dados da equipa do formando - usar dados reais do contexto
  const myTeam = {
    id: loggedStudent?.teamId || '1',
    name: loggedStudent?.teamName || 'Sem Equipa',
    course: loggedStudent?.courseName && 
            loggedStudent.courseName !== 'Curso Inexistente' && 
            loggedStudent.courseName !== 'Sem Curso' && 
            loggedStudent.courseName !== 'Erro ao carregar curso'
      ? loggedStudent.courseName
      : 'Aguardando atribuição',
    role: 'Formando',
    avatar: loggedStudent?.teamName ? loggedStudent.teamName.charAt(0).toUpperCase() : 'F'
  };

  // Carregar dados dinâmicos do backend
  useEffect(() => {
    // Limpar selectedUserStory ao entrar no Dashboard
    setSelectedUserStory(null);
    
    if (loggedStudent?.teamId) {
      loadTeamData();
      
      // Polling automático a cada 30 segundos (melhor para UX)
      const intervalId = setInterval(() => {
        console.log('[FormandoDashboard] 🔄 Auto-reload - A recarregar dados...');
        loadTeamData();
      }, 30000); // 30 segundos

      // Cleanup ao desmontar o componente
      return () => {
        console.log('[FormandoDashboard] 🛑 Limpando polling automático');
        clearInterval(intervalId);
      };
    }
  }, [loggedStudent]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      let studentsData: any = null;
      let storiesData: any = null;
      let sprintsData: any = null;
      
      // ✅ 1. Carregar membros da equipa (com fallback para Mock API)
      try {
        const studentsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/students`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (studentsResponse.ok) {
          studentsData = await studentsResponse.json();
          console.log('[FormandoDashboard] ✅ Estudantes recebidos do backend');
        }
      } catch (fetchError) {
        console.log('[FormandoDashboard] ⚠️ Backend não disponível para estudantes, usando Mock API...');
      }
      
      // Fallback para Mock API se backend falhou
      if (!studentsData || !studentsData.success) {
        studentsData = await mockAPI.getStudents();
        console.log('[FormandoDashboard] ✅ Estudantes recebidos do Mock API');
      }
      
      if (studentsData?.success && Array.isArray(studentsData.students)) {
        // Filtrar apenas membros da mesma equipa
        const teamMembersData = studentsData.students.filter(
          (student: any) => student.teamId === loggedStudent.teamId
        );
        setTeamMembers(teamMembersData);
      }

      // ✅ 2. Carregar user stories (com fallback para Mock API)
      try {
        const storiesResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (storiesResponse.ok) {
          storiesData = await storiesResponse.json();
          console.log('[FormandoDashboard] ✅ Stories recebidas do backend');
        }
      } catch (fetchError) {
        console.log('[FormandoDashboard] ⚠️ Backend não disponível para stories, usando Mock API...');
      }
      
      // Fallback para Mock API se backend falhou
      if (!storiesData || !storiesData.success) {
        storiesData = await mockAPI.getStories();
        console.log('[FormandoDashboard] ✅ Stories recebidas do Mock API');
      }
      
      if (storiesData?.success && Array.isArray(storiesData.stories)) {
        // Filtrar stories do curso atual
        const courseStories = storiesData.stories.filter(
          (story: any) => story.courseId === loggedStudent.courseId
        );
        setUserStories(courseStories);
      }

      // ✅ 3. Carregar sprints (com fallback para Mock API)
      try {
        const sprintsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/sprints`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (sprintsResponse.ok) {
          sprintsData = await sprintsResponse.json();
          console.log('[FormandoDashboard] ✅ Sprints recebidos do backend');
        }
      } catch (fetchError) {
        console.log('[FormandoDashboard] ⚠️ Backend não disponível para sprints, usando Mock API...');
      }
      
      // Fallback para Mock API se backend falhou
      if (!sprintsData || !sprintsData.success) {
        sprintsData = await mockAPI.getSprints();
        console.log('[FormandoDashboard] ✅ Sprints recebidos do Mock API');
      }
      
      if (sprintsData?.success && Array.isArray(sprintsData.sprints)) {
        // Filtrar sprints do curso atual
        const courseSprints = sprintsData.sprints.filter(
          (sprint: any) => sprint.courseId === loggedStudent.courseId
        );
        setSprints(courseSprints);
      }
    } catch (error) {
      console.error('[FormandoDashboard] ❌ Erro ao carregar dados da equipa:', error);
      // Não mostrar erro ao utilizador - dados já foram carregados via Mock API
    } finally {
      setLoading(false);
    }
  };

  // Calcular KPIs dinâmicos
  const calculateKPIs = () => {
    console.log('[FormandoDashboard] 📊 Calculando KPIs...');
    console.log('[FormandoDashboard] Total teamMembers:', teamMembers.length);
    console.log('[FormandoDashboard] Total userStories:', userStories.length);
    console.log('[FormandoDashboard] Stories:', userStories);
    
    // Calcular story points por membro baseado em votos ou pontos finais
    const memberPoints = teamMembers.map(member => {
      console.log('[FormandoDashboard] 👤 Calculando pontos para:', member.name);
      
      // Contar TODOS os votos do membro em TODAS as stories
      let totalPoints = 0;
      
      userStories.forEach(story => {
        // Verificar se este membro votou nesta story
        if (story.votes && Array.isArray(story.votes)) {
          const memberVote = story.votes.find((v: any) => v.studentName === member.name);
          if (memberVote) {
            console.log(`[FormandoDashboard] ✅ ${member.name} votou ${memberVote.value} em "${story.title}"`);
            totalPoints += memberVote.value || 0;
          }
        }
      });
      
      console.log(`[FormandoDashboard] 📊 Total de pontos de ${member.name}:`, totalPoints);
      
      return { ...member, points: totalPoints };
    });

    console.log('[FormandoDashboard] 📊 Member points:', memberPoints);

    // Story points do usuário logado
    const myStoryPoints = memberPoints.find(
      m => m.id === loggedStudent?.id
    )?.points || 0;

    // Total de pontos da equipa
    const totalPoints = memberPoints.reduce((sum, m) => sum + m.points, 0);

    // Calcular velocidade (story points concluídos)
    const completedStories = userStories.filter(story => story.status === 'done');
    const velocity = completedStories.reduce((sum, story) => {
      // Priorizar pontos finais, senão calcular média dos votos
      if (story.points && Number(story.points) > 0) {
        return sum + Number(story.points);
      }
      if (story.votes && story.votes.length > 0) {
        const averageVote = Math.round(
          story.votes.reduce((acc: number, vote: any) => acc + vote.value, 0) / story.votes.length
        );
        return sum + averageVote;
      }
      return sum;
    }, 0);

    // Taxa de conclusão
    const totalStories = userStories.length;
    const completionRate = totalStories > 0 
      ? Math.round((completedStories.length / totalStories) * 100) 
      : 0;

    console.log('[FormandoDashboard] 📊 KPIs finais:', {
      velocity,
      completionRate,
      myStoryPoints,
      totalPoints,
      memberPoints: memberPoints.map(m => ({ name: m.name, points: m.points }))
    });

    return {
      velocity,
      velocityTrend: '+9%',
      completionRate,
      completionTrend: '+3%',
      myStoryPoints,
      storyPointsTrend: '+4',
      teamMembers: teamMembers.length,
      memberPoints,
      totalPoints
    };
  };

  const teamKPIs = calculateKPIs();

  // Calcular dados dinâmicos do burndown baseado em stories concluídas - ✅ MEMOIZADO
  const burndownData = useMemo(() => {
    // Se não houver stories, retornar dados vazios
    if (userStories.length === 0) {
      return [];
    }

    // Total de story points
    const totalPoints = userStories.reduce((sum, story) => sum + (story.points || 0), 0);
    
    // Pontos concluídos
    const completedPoints = userStories
      .filter(story => story.status === 'done')
      .reduce((sum, story) => sum + (story.points || 0), 0);

    // Pontos restantes
    const remainingPoints = totalPoints - completedPoints;

    // Criar dados simulados para o gráfico (10 dias)
    const days = 10;
    const data = [];
    
    for (let i = 0; i <= days; i++) {
      const idealRemaining = totalPoints - (totalPoints / days) * i;
      // Simular progresso real baseado no percentual de conclusão atual
      const completionRate = totalPoints > 0 ? completedPoints / totalPoints : 0;
      const realRemaining = i === days 
        ? remainingPoints 
        : totalPoints - (totalPoints * completionRate * (i / days));
      
      data.push({
        id: `burndown-day-${i}`, // ✅ ID único para evitar keys duplicadas
        day: `Dia ${i + 1}`,
        ideal: Math.max(0, Math.round(idealRemaining)),
        real: Math.max(0, Math.round(realRemaining))
      });
    }

    return data;
  }, [userStories]); // Recalcular apenas quando userStories mudar

  // Calcular dados dinâmicos de velocidade baseado em sprints - ✅ MEMOIZADO
  const velocityData = useMemo(() => {
    const velocity = teamKPIs.velocity || 20; // valor mínimo de 20 se não houver dados
    const data = [];
    
    // Usar seed baseada em dados reais para manter consistência
    const seed = userStories.length + teamMembers.length;
    
    for (let i = 1; i <= 5; i++) {
      // Simular variação de ±20% na velocidade (DETERMINISTICO baseado em seed)
      const variation = ((seed * i) % 40 - 20) / 100; // -20% a +20% deterministico
      const plannedPoints = Math.max(10, Math.round(velocity * (1 + variation)));
      const completedPoints = Math.max(8, Math.round(plannedPoints * (0.85 + ((seed * i * 2) % 15) / 100))); // 85-100% conclusão
      
      data.push({
        id: `velocity-sprint-${i}`, // ✅ ID único para evitar keys duplicadas
        sprint: `S${i}`,
        planeado: plannedPoints,
        concluido: completedPoints
      });
    }

    return data;
  }, [teamKPIs.velocity, userStories.length, teamMembers.length]); // Recalcular apenas quando velocidade ou tamanhos mudarem

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 pt-[100px] dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <Header onNavigate={onNavigate} showProfile={false} />

      {/* Main Content */}
      <div className="w-full max-w-md mx-auto px-6 pt-6 pb-6 space-y-6">
        {/* Minha Equipa - Destaque */}
        <div className="bg-gradient-to-br from-[#0b87ac] to-[#096d8a] rounded-[16px] p-5 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-[12px] mb-1">Minha Equipa</p>
              <h2 className="text-[20px] font-medium mb-1">{myTeam.name}</h2>
              <p className="text-white/90 text-[13px]">{myTeam.course}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-[20px] font-medium border-2 border-white/30">
              {myTeam.avatar}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/70 text-[11px] mb-1">Velocidade</p>
              <p className="text-[18px] font-medium">{teamKPIs.velocity} pts</p>
            </div>
            <div>
              <p className="text-white/70 text-[11px] mb-1">Conclusão</p>
              <p className="text-[18px] font-medium">{teamKPIs.completionRate}%</p>
            </div>
            <div>
              <p className="text-white/70 text-[11px] mb-1">Membros</p>
              <p className="text-[18px] font-medium">{teamKPIs.teamMembers}</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate?.('courseDetails')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left dark:bg-slate-800"
            aria-label="Ver Sprints"
          >
            <div className="bg-[#0b87ac] p-2 rounded-[10px] w-fit mb-3">
              <ListTodo className="text-white" size={20} />
            </div>
            <p className="text-[14px] font-medium text-slate-800 dark:text-slate-200">Ver Sprints</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{sprints.length} ativos</p>
          </button>

          <button
            onClick={() => onNavigate?.('messagesFormando')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left dark:bg-slate-800"
            aria-label="Ver Mensagens"
          >
            <div className="bg-[#0b87ac] p-2 rounded-[10px] w-fit mb-3">
              <Mail className="text-white" size={20} />
            </div>
            <p className="text-[14px] font-medium text-slate-800 dark:text-slate-200">Mensagens</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Dos formadores</p>
          </button>

          <button
            onClick={() => onNavigate?.('alerts')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left dark:bg-slate-800"
            aria-label="Ver Alertas"
          >
            <div className="bg-orange-600 p-2 rounded-[10px] w-fit mb-3 relative">
              <Bell className="text-white" size={20} />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadAlerts}
                </span>
              )}
            </div>
            <p className="text-[14px] font-medium text-slate-800 dark:text-slate-200">Alertas</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{unreadAlerts} novos</p>
          </button>

          <button
            onClick={() => onNavigate?.('calendar')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left dark:bg-slate-800"
            aria-label="Ver Calendário"
          >
            <div className="bg-purple-600 p-2 rounded-[10px] w-fit mb-3">
              <Calendar className="text-white" size={20} />
            </div>
            <p className="text-[14px] font-medium text-slate-800 dark:text-slate-200">Calendário</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">5 eventos</p>
          </button>
        </div>

        {/* Meus Story Points */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] text-slate-800 dark:text-slate-200">Meus Story Points</h2>
            <Award className="text-[#0b87ac]" size={20} />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] text-slate-600 dark:text-slate-400 mb-1">Sprint Atual</p>
                <p className="text-[28px] text-[#0b87ac]">{teamKPIs.myStoryPoints} pts</p>
              </div>
              <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-[10px] dark:bg-green-900/30">
                <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400 text-[14px]">{teamKPIs.storyPointsTrend}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-[13px] mb-2">
                <span className="text-slate-600 dark:text-slate-400">Progresso do Sprint</span>
                <span className="text-slate-800 dark:text-slate-200">{teamKPIs.completionRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 dark:bg-slate-700">
                <div 
                  className="bg-gradient-to-r from-[#0b87ac] to-[#0ea3d1] h-3 rounded-full transition-all" 
                  style={{ width: `${teamKPIs.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance da Equipa */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800">
          <h2 className="text-[16px] text-slate-800 dark:text-slate-200 mb-4">Membros da Equipa</h2>
          
          {loading ? (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-[13px]">Carregando membros...</div>
          ) : teamKPIs.memberPoints && teamKPIs.memberPoints.length > 0 ? (
            <div className="space-y-3">
              {teamKPIs.memberPoints.map((member: any, index: number) => {
                const isCurrentUser = member.id === loggedStudent?.id;
                const colors = [
                  'from-blue-400 to-blue-600',
                  'from-purple-400 to-purple-600',
                  'from-green-400 to-green-600',
                  'from-orange-400 to-orange-600',
                  'from-pink-400 to-pink-600',
                  'from-cyan-400 to-cyan-600'
                ];
                const colorClass = isCurrentUser 
                  ? 'from-[#0b87ac] to-[#096d8a]' 
                  : colors[index % colors.length];
                
                const initials = member.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);

                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 rounded-[12px] ${
                      isCurrentUser 
                        ? 'bg-blue-50 border-2 border-[#0b87ac] dark:bg-blue-900/20 dark:border-[#0b87ac]' 
                        : 'bg-slate-50 dark:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center text-white text-[13px]`}>
                        {initials}
                      </div>
                      <div>
                        <p className="text-[14px] text-slate-800 dark:text-slate-200">{member.name}</p>
                        <p className={`text-[11px] ${isCurrentUser ? 'text-[#0b87ac]' : 'text-slate-500 dark:text-slate-400'}`}>
                          {isCurrentUser ? 'Você' : 'Formando'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] text-[#0b87ac]">{member.points || 0} pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-[13px]">Nenhum membro encontrado</div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-600 dark:text-slate-400">Total da Equipa</span>
              <strong className="text-[#0b87ac] text-[16px]">{teamKPIs.totalPoints} pts</strong>
            </div>
          </div>
        </div>

        {/* Burndown Chart */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] text-slate-800 dark:text-slate-200">Burndown Chart</h2>
            <div className="bg-blue-100 px-3 py-1 rounded-[8px] dark:bg-blue-900/30">
              <p className="text-[11px] text-blue-700 dark:text-blue-400">Sprint Atual</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200} key={`burndown-${burndownData.length}-${burndownData[0]?.real || 0}`}>
            <LineChart data={burndownData}>
              <CartesianGrid key="grid-burndown" strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                key="xaxis-burndown"
                dataKey="day" 
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <YAxis 
                key="yaxis-burndown"
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <Tooltip 
                key="tooltip-burndown"
                contentStyle={{ 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  fontSize: '12px'
                }}
              />
              <Legend 
                key="legend-burndown"
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Line 
                key="line-ideal-burndown"
                type="monotone" 
                dataKey="ideal" 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Ideal"
                dot={false}
                isAnimationActive={false}
              />
              <Line 
                key="line-real-burndown"
                type="monotone" 
                dataKey="real" 
                stroke="#0b87ac" 
                strokeWidth={3}
                name="Real"
                dot={{ fill: '#0b87ac', r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#0b87ac] rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">Trabalho Restante: <strong className="text-slate-800 dark:text-slate-200">0 pts</strong></span>
              </div>
              <span className="text-green-600 dark:text-green-400">Concluído ✓</span>
            </div>
          </div>
        </div>

        {/* Velocity Chart */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] text-slate-800 dark:text-slate-200">Velocidade da Equipa</h2>
            <BarChart3 className="text-[#0b87ac]" size={20} />
          </div>

          <ResponsiveContainer width="100%" height={200} key={`velocity-${velocityData.length}-${velocityData[0]?.concluido || 0}`}>
            <BarChart data={velocityData}>
              <CartesianGrid key="grid-velocity" strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                key="xaxis-velocity"
                dataKey="sprint" 
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <YAxis 
                key="yaxis-velocity"
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <Tooltip 
                key="tooltip-velocity"
                contentStyle={{ 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  fontSize: '12px'
                }}
              />
              <Legend key="legend-velocity" wrapperStyle={{ fontSize: '12px' }} />
              <Bar 
                key="bar-planeado-velocity"
                dataKey="planeado" 
                fill="#94a3b8" 
                radius={[8, 8, 0, 0]}
                name="Planeado"
                isAnimationActive={false}
              />
              <Bar 
                key="bar-concluido-velocity"
                dataKey="concluido" 
                fill="#0b87ac" 
                radius={[8, 8, 0, 0]}
                name="Concluído"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-600 dark:text-slate-400">Velocidade Média</span>
              <div className="flex items-center gap-2">
                <strong className="text-[#0b87ac] text-[16px]">{teamKPIs.velocity} pts</strong>
                <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-[6px] dark:bg-green-900/30">
                  <TrendingUp size={12} className="text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400 text-[11px]">{teamKPIs.velocityTrend}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}