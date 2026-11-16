import { useState, useEffect, useMemo } from 'react';
import { BookOpen, MessageSquare, Bell, Calendar, User, ListTodo, Mail, Award, TrendingUp, BarChart3 } from 'lucide-react';
import { SprintCharts } from './shared/SprintCharts';
import { averageVelocity, currentSprint, velocityBySprint, voteToPoints } from '../data/sprintMetrics';
import { useApp } from '../context/AppContext';
import { API_URL } from '../data/database';
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
          `${API_URL}/students`,
          {
            method: 'GET',
            headers: {
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
        studentsData = ({ success: true, students: [] as any[] });
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
          `${API_URL}/stories`,
          {
            method: 'GET',
            headers: {
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
        storiesData = ({ success: true, stories: [] as any[] });
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
          `${API_URL}/sprints`,
          {
            method: 'GET',
            headers: {
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
        sprintsData = ({ success: true, sprints: [] as any[] });
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

  // Calcular KPIs a partir dos dados reais (user stories e votos do Scrum Poker)
  const calculateKPIs = () => {
    const isMemberVote = (member: any, v: any) =>
      (v.userId && v.userId === member.id) || (v.userName && v.userName === member.name);

    // Pontos de cada membro: soma das estimativas que deu nas votações
    const memberPoints = teamMembers.map(member => {
      const points = userStories.reduce((sum, story) => {
        const vote = (story.votes || []).find((v: any) => isMemberVote(member, v));
        return sum + (vote ? voteToPoints(vote.vote ?? vote.value) || 0 : 0);
      }, 0);
      return { ...member, points };
    });

    const totalPoints = memberPoints.reduce((sum, m) => sum + m.points, 0);

    // Velocidade: média dos pontos concluídos por sprint da equipa
    const teamSprints = sprints.filter((sp: any) => !sp.teamId || sp.teamId === loggedStudent?.teamId);
    const velocity = averageVelocity(velocityBySprint(teamSprints, userStories));

    // Sprint atual: os meus pontos e o progresso referem-se às suas user stories
    const sprintNow = currentSprint(teamSprints);
    const sprintStories = sprintNow ? userStories.filter(st => st.sprintId === sprintNow.id) : userStories;
    const me = teamMembers.find(m => m.id === loggedStudent?.id) || loggedStudent;
    const myStoryPoints = me
      ? sprintStories.reduce((sum, story) => {
          const vote = (story.votes || []).find((v: any) => isMemberVote(me, v));
          return sum + (vote ? voteToPoints(vote.vote ?? vote.value) || 0 : 0);
        }, 0)
      : 0;
    const completedStories = sprintStories.filter(story => story.status === 'done');
    const completionRate = sprintStories.length > 0
      ? Math.round((completedStories.length / sprintStories.length) * 100)
      : 0;

    return {
      velocity,
      completionRate,
      myStoryPoints,
      teamMembers: teamMembers.length,
      memberPoints,
      totalPoints
    };
  };

  const teamKPIs = calculateKPIs();

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 pt-[100px] dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <Header onNavigate={onNavigate} showProfile={false} />

      {/* Main Content */}
      <div className="w-full max-w-md mx-auto px-6 pt-6 pb-6 space-y-6">
        {/* Minha Equipa - Destaque */}
        <div className="bg-gradient-to-br from-[#0a7da0] to-[#096d8a] rounded-[16px] p-5 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-[0.75rem] mb-1">Minha Equipa</p>
              <h2 className="text-[1.25rem] font-medium mb-1">{myTeam.name}</h2>
              <p className="text-white/90 text-[0.8125rem]">{myTeam.course}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-[1.25rem] font-medium border-2 border-white/30">
              {myTeam.avatar}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/70 text-[0.6875rem] mb-1">Velocidade</p>
              <p className="text-[1.125rem] font-medium">{teamKPIs.velocity} pts</p>
            </div>
            <div>
              <p className="text-white/70 text-[0.6875rem] mb-1">Conclusão</p>
              <p className="text-[1.125rem] font-medium">{teamKPIs.completionRate}%</p>
            </div>
            <div>
              <p className="text-white/70 text-[0.6875rem] mb-1">Membros</p>
              <p className="text-[1.125rem] font-medium">{teamKPIs.teamMembers}</p>
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
            <div className="bg-[#0a7da0] p-2 rounded-[10px] w-fit mb-3">
              <ListTodo className="text-white" size={20} />
            </div>
            <p className="text-[0.875rem] font-medium text-slate-800 dark:text-slate-200">Ver Sprints</p>
            <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 mt-1">{sprints.length} ativos</p>
          </button>

          <button
            onClick={() => onNavigate?.('messagesFormando')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left dark:bg-slate-800"
            aria-label="Ver Mensagens"
          >
            <div className="bg-[#0a7da0] p-2 rounded-[10px] w-fit mb-3">
              <Mail className="text-white" size={20} />
            </div>
            <p className="text-[0.875rem] font-medium text-slate-800 dark:text-slate-200">Mensagens</p>
            <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 mt-1">Com o formador</p>
          </button>

          <button
            onClick={() => onNavigate?.('alerts')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left dark:bg-slate-800"
            aria-label="Ver Alertas"
          >
            <div className="bg-orange-600 p-2 rounded-[10px] w-fit mb-3 relative">
              <Bell className="text-white" size={20} />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[0.625rem] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadAlerts}
                </span>
              )}
            </div>
            <p className="text-[0.875rem] font-medium text-slate-800 dark:text-slate-200">Alertas</p>
            <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 mt-1">{unreadAlerts} novos</p>
          </button>

          <button
            onClick={() => onNavigate?.('calendar')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left dark:bg-slate-800"
            aria-label="Ver Calendário"
          >
            <div className="bg-purple-600 p-2 rounded-[10px] w-fit mb-3">
              <Calendar className="text-white" size={20} />
            </div>
            <p className="text-[0.875rem] font-medium text-slate-800 dark:text-slate-200">Calendário</p>
            <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 mt-1">5 eventos</p>
          </button>
        </div>

        {/* Meus Story Points */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[1rem] text-slate-800 dark:text-slate-200">Meus Story Points</h2>
            <Award className="text-[#0a7da0]" size={20} />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.875rem] text-slate-600 dark:text-slate-400 mb-1">Sprint Atual</p>
                <p className="text-[1.75rem] text-[#0a7da0]">{teamKPIs.myStoryPoints} pts</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-[0.8125rem] mb-2">
                <span className="text-slate-600 dark:text-slate-400">Progresso do Sprint</span>
                <span className="text-slate-800 dark:text-slate-200">{teamKPIs.completionRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 dark:bg-slate-700">
                <div 
                  className="bg-gradient-to-r from-[#0a7da0] to-[#0ea3d1] h-3 rounded-full transition-all" 
                  style={{ width: `${teamKPIs.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance da Equipa */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800">
          <h2 className="text-[1rem] text-slate-800 dark:text-slate-200 mb-4">Membros da Equipa</h2>
          
          {loading ? (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-[0.8125rem]">Carregando membros...</div>
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
                  ? 'from-[#0a7da0] to-[#096d8a]' 
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
                        ? 'bg-blue-50 border-2 border-[#0a7da0] dark:bg-blue-900/20 dark:border-[#0a7da0]' 
                        : 'bg-slate-50 dark:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center text-white text-[0.8125rem]`}>
                        {initials}
                      </div>
                      <div>
                        <p className="text-[0.875rem] text-slate-800 dark:text-slate-200">{member.name}</p>
                        <p className={`text-[0.6875rem] ${isCurrentUser ? 'text-[#0a7da0]' : 'text-slate-500 dark:text-slate-400'}`}>
                          {isCurrentUser ? 'Você' : 'Formando'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.875rem] text-[#0a7da0]">{member.points || 0} pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-[0.8125rem]">Nenhum membro encontrado</div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-[0.8125rem]">
              <span className="text-slate-600 dark:text-slate-400">Total da Equipa</span>
              <strong className="text-[#0a7da0] text-[1rem]">{teamKPIs.totalPoints} pts</strong>
            </div>
          </div>
        </div>

        {/* Gráficos por sprint (dados reais: user stories e votos do Scrum Poker) */}
        <SprintCharts
          sprints={sprints.filter((sp: any) => !sp.teamId || sp.teamId === loggedStudent?.teamId)}
          stories={userStories}
          color="#0a7da0"
        />
      </div>
    </div>
  );
}