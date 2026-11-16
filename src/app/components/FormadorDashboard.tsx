import { useState, useEffect } from 'react';
import { Home, BookOpen, Users, Calendar, MessageSquare, Settings, ChevronDown, BarChart3, TrendingUp, AlertCircle, Bell } from 'lucide-react';
import { SprintCharts } from './shared/SprintCharts';
import { averageVelocity, velocityBySprint } from '../data/sprintMetrics';
import { useApp } from '../context/AppContext';
import { API_URL } from '../data/database';
import { Header } from './shared/Header';

interface FormadorDashboardProps {
  onLogout: () => void;
  onNavigate?: (screen: string) => void;
}

export function FormadorDashboard({ onLogout, onNavigate }: FormadorDashboardProps) {
  const { unreadMessages, unreadAlerts } = useApp();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');

  // Estados para dados dinâmicos
  const [teams, setTeams] = useState<any[]>([]);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados do backend
  useEffect(() => {
    loadAllData();
    
    // Polling automático a cada 30 segundos (melhor para UX)
    const intervalId = setInterval(() => {
      console.log('[FormadorDashboard] 🔄 Auto-reload - A recarregar dados...');
      loadAllData();
    }, 30000); // 30 segundos

    // Cleanup ao desmontar o componente
    return () => {
      console.log('[FormadorDashboard] 🛑 Limpando polling automático');
      clearInterval(intervalId);
    };
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      let coursesData: any = null;
      let teamsData: any = null;
      let studentsData: any = null;
      let sprintsData: any = null;
      let storiesData: any = null;

      // ✅ 1. Carregar courses (com fallback para Mock API)
      try {
        const coursesResponse = await fetch(
          `${API_URL}/courses`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (coursesResponse.ok) {
          coursesData = await coursesResponse.json();
          console.log('[FormadorDashboard] ✅ Cursos recebidos do backend');
        }
      } catch (fetchError) {
        console.log('[FormadorDashboard] ⚠️ Backend não disponível para cursos, usando Mock API...');
      }
      
      // Fallback para Mock API se backend falhou
      if (!coursesData || !coursesData.success) {
        coursesData = ({ success: true, courses: [] as any[] });
        console.log('[FormadorDashboard] ✅ Cursos recebidos do Mock API');
      }
      
      if (coursesData?.success && Array.isArray(coursesData.courses)) {
        const allCourses = [
          { id: 'all', name: 'Todos os Cursos' },
          ...coursesData.courses
        ];
        setCourses(allCourses);
      }

      // Só mostrar dados de cursos que ainda existem (cursos apagados deixam equipas, formandos, sprints e stories órfãos)
      const existingCourses: any[] = Array.isArray(coursesData?.courses) ? coursesData.courses : [];
      const courseNameById = new Map<string, string>(existingCourses.map((c: any) => [c.id, c.name]));
      const belongsToExistingCourse = (item: any) => courseNameById.has(item?.courseId);

      // ✅ 2. Carregar teams (com fallback para Mock API)
      try {
        const teamsResponse = await fetch(
          `${API_URL}/teams`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (teamsResponse.ok) {
          teamsData = await teamsResponse.json();
          console.log('[FormadorDashboard] ✅ Equipas recebidas do backend');
        }
      } catch (fetchError) {
        console.log('[FormadorDashboard] ⚠️ Backend não disponível para equipas, usando Mock API...');
      }
      
      // Fallback para Mock API se backend falhou
      if (!teamsData || !teamsData.success) {
        teamsData = ({ success: true, teams: [] as any[] });
        console.log('[FormadorDashboard] ✅ Equipas recebidas do Mock API');
      }
      
      if (teamsData?.success && Array.isArray(teamsData.teams)) {
        setTeams(
          teamsData.teams
            .filter(belongsToExistingCourse)
            .map((t: any) => ({ ...t, courseName: courseNameById.get(t.courseId) }))
        );
      }

      // ✅ 3. Carregar students (com fallback para Mock API)
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
          console.log('[FormadorDashboard] ✅ Estudantes recebidos do backend');
        }
      } catch (fetchError) {
        console.log('[FormadorDashboard] ⚠️ Backend não disponível para estudantes, usando Mock API...');
      }
      
      // Fallback para Mock API se backend falhou
      if (!studentsData || !studentsData.success) {
        studentsData = ({ success: true, students: [] as any[] });
        console.log('[FormadorDashboard] ✅ Estudantes recebidos do Mock API');
      }
      
      if (studentsData?.success && Array.isArray(studentsData.students)) {
        setStudents(studentsData.students.filter(belongsToExistingCourse));
      }

      // ✅ 4. Carregar sprints (com fallback para Mock API)
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
          console.log('[FormadorDashboard] ✅ Sprints recebidos do backend');
        }
      } catch (fetchError) {
        console.log('[FormadorDashboard] ⚠️ Backend não disponível para sprints, usando Mock API...');
      }
      
      // Fallback para Mock API se backend falhou
      if (!sprintsData || !sprintsData.success) {
        sprintsData = ({ success: true, sprints: [] as any[] });
        console.log('[FormadorDashboard] ✅ Sprints recebidos do Mock API');
      }
      
      if (sprintsData?.success && Array.isArray(sprintsData.sprints)) {
        setSprints(sprintsData.sprints.filter(belongsToExistingCourse));
      }

      // ✅ 5. Carregar user stories (com fallback para Mock API)
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
          console.log('[FormadorDashboard] ✅ Stories recebidas do backend');
        }
      } catch (fetchError) {
        console.log('[FormadorDashboard] ⚠️ Backend não disponível para stories, usando Mock API...');
      }
      
      // Fallback para Mock API se backend falhou
      if (!storiesData || !storiesData.success) {
        storiesData = ({ success: true, stories: [] as any[] });
        console.log('[FormadorDashboard] ✅ Stories recebidas do Mock API');
      }
      
      if (storiesData?.success && Array.isArray(storiesData.stories)) {
        setUserStories(storiesData.stories.filter(belongsToExistingCourse));
      }
    } catch (error) {
      console.error('[FormadorDashboard] ❌ Erro ao carregar dados:', error);
      // Não mostrar erro ao utilizador - dados já foram carregados via Mock API
    } finally {
      setLoading(false);
    }
  };

  // Calcular performance dinâmica de cada equipa FILTRADA pelo curso selecionado
  const calculateTeamPerformance = () => {
    // Filtrar apenas equipas reais (não "all")
    let realTeams = teams.filter(t => t.id !== 'all');
    
    // FILTRAR POR CURSO SELECIONADO
    if (selectedCourse !== 'all') {
      realTeams = realTeams.filter(t => t.courseId === selectedCourse);
      console.log(`[calculateTeamPerformance] 🔍 Filtrando equipas pelo curso "${selectedCourse}":`, realTeams.map(t => t.name));
    }
    
    // FILTRAR POR EQUIPA SELECIONADA
    if (selectedTeam !== 'all') {
      realTeams = realTeams.filter(t => t.id === selectedTeam);
      console.log(`[calculateTeamPerformance] 🎯 Filtrando pela equipa "${selectedTeam}":`, realTeams.map(t => t.name));
    }
    
    return realTeams.map(team => {
      // Filtrar stories da equipa (baseado no courseId)
      const teamStories = userStories.filter(story => story.courseId === team.courseId);
      
      // Velocidade: média dos pontos concluídos por sprint (pontos definidos ou média dos votos)
      const completedStories = teamStories.filter(story => story.status === 'done');
      const teamSprints = sprints.filter((sp: any) => sp.courseId === team.courseId && (!sp.teamId || sp.teamId === team.id));
      const velocity = averageVelocity(velocityBySprint(teamSprints, teamStories));
      
      // Calcular taxa de conclusão
      const totalStories = teamStories.length;
      const completionRate = totalStories > 0 
        ? Math.round((completedStories.length / totalStories) * 100) 
        : 0;

      // Contar membros
      const memberCount = students.filter(s => s.teamId === team.id).length;

      return {
        ...team,
        velocity,
        completionRate,
        memberCount
      };
    });
  };

  const teamPerformance = calculateTeamPerformance();

  // Obter equipas do curso selecionado - filtra as equipas baseado no curso
  const getAvailableTeams = () => {
    if (selectedCourse === 'all') {
      return [
        { id: 'all', name: 'Todas as Equipas' },
        ...teams
      ];
    }
    // Filtrar equipas pelo courseId
    const courseTeams = teams.filter(t => t.courseId === selectedCourse);
    return [
      { id: 'all', name: 'Todas as Equipas' },
      ...courseTeams
    ];
  };

  const availableTeams = getAvailableTeams();

  // Resetar equipa quando curso muda - mantém consistência nos filtros
  const handleCourseChange = (courseId: string) => {
    console.log(`[FormadorDashboard] 🔄 MUDOU CURSO: "${courseId}"`);
    console.log(`[FormadorDashboard] 📊 Dados antes da filtragem:`);
    console.log(`  - Total Teams: ${teams.length}`, teams.map(t => ({ id: t.id, name: t.name, courseId: t.courseId })));
    console.log(`  - Total Students: ${students.length}`, students.map(s => ({ id: s.id, name: s.name, courseId: s.courseId })));
    console.log(`  - Total Sprints: ${sprints.length}`, sprints.map(s => ({ id: s.id, name: s.name, courseId: s.courseId })));
    
    setSelectedCourse(courseId);
    setSelectedTeam('all');
    
    // Calcular e mostrar os resultados filtrados
    if (courseId !== 'all') {
      const filteredTeams = teams.filter(t => t.courseId === courseId);
      const filteredStudents = students.filter(s => s.courseId === courseId);
      const filteredSprints = sprints.filter(s => s.courseId === courseId);
      
      console.log(`[FormadorDashboard] ✅ Dados APÓS filtragem por courseId="${courseId}":`);
      console.log(`  - Teams filtradas: ${filteredTeams.length}`, filteredTeams.map(t => t.name));
      console.log(`  - Students filtrados: ${filteredStudents.length}`, filteredStudents.map(s => s.name));
      console.log(`  - Sprints filtrados: ${filteredSprints.length}`, filteredSprints.map(s => s.name));
    }
  };

// inicio conta formados

  const getStudentCount = (courseId: string) => {
    return students.filter(s => s.courseId === courseId).length;
  };

  // Calcular estatísticas dinâmicas FILTRADAS pelo curso selecionado
  const getActiveCourses = () => {
    // Excluir "all" e contar apenas cursos reais
    return courses.filter(c => c.id !== 'all').length;
  };

  const getTotalSprints = () => {
    if (selectedCourse === 'all') {
      return sprints.length;
    }
    return sprints.filter(s => s.courseId === selectedCourse).length;
  };

  const getTotalTeams = () => {
    if (selectedCourse === 'all') {
      return teams.length;
    }
    return teams.filter(t => t.courseId === selectedCourse).length;
  };

  const getTotalStudents = () => {
    if (selectedCourse === 'all') {
      return students.length;
    }
    return students.filter(s => s.courseId === selectedCourse).length;
  };

  const getTotalUserStories = () => {
    if (selectedCourse === 'all') {
      return userStories.length;
    }
    return userStories.filter(s => s.courseId === selectedCourse).length;
  };

// fim
  
  // Sprints e user stories conforme os filtros de curso e equipa
  const chartSprints = sprints.filter((sp: any) =>
    (selectedCourse === 'all' || sp.courseId === selectedCourse) &&
    (selectedTeam === 'all' || !sp.teamId || sp.teamId === selectedTeam)
  );
  const chartStories = userStories.filter((st: any) => selectedCourse === 'all' || st.courseId === selectedCourse);

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 pt-[100px] dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <Header onNavigate={onNavigate} showProfile={false} />

      {/* Main Content */}
      <div className="w-full max-w-md mx-auto px-6 pt-10 pb-6 space-y-6">
        {/* Performance Cards - Grid 2x2 com 4 botões */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate?.('courseManagement')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-shadow text-left dark:bg-slate-800"
            aria-label="Gerir Cursos"
          >
            <div className="bg-[#3b8433] p-2 rounded-[10px] w-fit mb-3 mx-auto">
              <BookOpen className="text-white" size={20} />
            </div>
            <p className="text-[0.8125rem] text-slate-800 dark:text-slate-200 text-center">Gerir Cursos</p>
            <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 mt-1 text-center">
              {loading ? '...' : `${getActiveCourses()}`}
            </p>
          </button>

          <button
            onClick={() => onNavigate?.('manageAlerts')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-shadow text-left dark:bg-slate-800"
            aria-label="Gerir Alertas"
          >
            <div className="bg-orange-600 p-2 rounded-[10px] w-fit mb-3 mx-auto">
              <Bell className="text-white" size={20} />
            </div>
            <p className="text-[0.8125rem] text-slate-800 dark:text-slate-200 text-center">Alertas</p>
            <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 mt-1 text-center">Gerir</p>
          </button>

          <button
            onClick={() => onNavigate?.('calendar')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-shadow text-left dark:bg-slate-800"
            aria-label="Calendário"
          >
            <div className="bg-purple-600 p-2 rounded-[10px] w-fit mb-3 mx-auto">
              <Calendar className="text-white" size={20} />
            </div>
            <p className="text-[0.8125rem] text-slate-800 dark:text-slate-200 text-center">Calendário</p>
            <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 mt-1 text-center">Ver</p>
          </button>

          <button
            onClick={() => onNavigate?.('messages')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-shadow text-left dark:bg-slate-800"
            aria-label="Mensagens"
          >
            <div className="bg-[#0a7da0] p-2 rounded-[10px] w-fit mb-3 mx-auto">
              <MessageSquare className="text-white" size={20} />
            </div>
            <p className="text-[0.8125rem] text-slate-800 dark:text-slate-200 text-center">Mensagens</p>
            <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 mt-1 text-center">{unreadMessages}</p>
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[0.75rem] text-slate-600 dark:text-slate-400 mb-2 block">Curso</label>
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-[12px] px-3 py-2 text-[0.875rem] text-slate-800 appearance-none cursor-pointer pr-8 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                aria-label="Filtrar por curso"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div>
            <label className="text-[0.75rem] text-slate-600 dark:text-slate-400 mb-2 block">Equipa</label>
            <div className="relative">
              <select
                value={selectedTeam}
                onChange={(e) => {
                  const newTeam = e.target.value;
                  console.log(`[FormadorDashboard] 🎯 MUDOU EQUIPA: "${newTeam}"`);
                  setSelectedTeam(newTeam);
                }}
                className="w-full bg-white border-2 border-slate-200 rounded-[12px] px-3 py-2 text-[0.875rem] text-slate-800 appearance-none cursor-pointer pr-8 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                aria-label="Filtrar por equipa"
              >
                {availableTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* Gráficos por sprint (dados reais: user stories e votos do Scrum Poker) */}
        <SprintCharts sprints={chartSprints} stories={chartStories} color="#3b8433" />

        {/* Performance por Equipa */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800">
          <h2 className="text-[1rem] text-slate-800 dark:text-slate-200 mb-4">Performance por Equipa</h2>
          
          {loading ? (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-[0.8125rem]">Carregando equipas...</div>
          ) : teamPerformance.length > 0 ? (
            <div className="space-y-4">
              {teamPerformance.map((team, index) => {
                const colors = [
                  'from-blue-400 to-blue-600',
                  'from-purple-400 to-purple-600',
                  'from-green-400 to-green-600',
                  'from-orange-400 to-orange-600',
                  'from-pink-400 to-pink-600',
                  'from-cyan-400 to-cyan-600'
                ];
                const colorClass = colors[index % colors.length];
                const barColor = ['#3b8433', '#0a7da0', 'rgb(147 51 234)', '#f97316', '#ec4899', '#06b6d4'][index % 6];
                
                const initials = team.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);

                return (
                  <div key={team.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center text-white text-[0.6875rem]`}>
                          {initials}
                        </div>
                        <div>
                          <p className="text-[0.875rem] text-slate-800 dark:text-slate-200">{team.name}</p>
                          <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400">{team.courseName || 'Sem Curso'} • {team.memberCount} membros</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[1rem]" style={{ color: barColor }}>{team.velocity} pts</p>
                        <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400">Velocidade</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                      <div 
                        className="h-2 rounded-full transition-all" 
                        style={{ width: `${team.completionRate}%`, backgroundColor: barColor }}
                      ></div>
                    </div>
                    <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 mt-1">{team.completionRate}% de conclusão</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-[0.8125rem]">Nenhuma equipa encontrada</div>
          )}
        </div>
      </div>
    </div>
  );
}
