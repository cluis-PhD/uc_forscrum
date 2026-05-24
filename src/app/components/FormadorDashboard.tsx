import { useState, useEffect } from 'react';
import { Home, BookOpen, Users, Calendar, MessageSquare, Settings, ChevronDown, BarChart3, TrendingUp, AlertCircle, Bell } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mockAPI } from '../utils/supabase/mock-api';
import { useApp } from '../context/AppContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
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
          `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/courses`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
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
        coursesData = await mockAPI.getCourses();
        console.log('[FormadorDashboard] ✅ Cursos recebidos do Mock API');
      }
      
      if (coursesData?.success && Array.isArray(coursesData.courses)) {
        const allCourses = [
          { id: 'all', name: 'Todos os Cursos' },
          ...coursesData.courses
        ];
        setCourses(allCourses);
      }

      // ✅ 2. Carregar teams (com fallback para Mock API)
      try {
        const teamsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
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
        teamsData = await mockAPI.getTeams();
        console.log('[FormadorDashboard] ✅ Equipas recebidas do Mock API');
      }
      
      if (teamsData?.success && Array.isArray(teamsData.teams)) {
        setTeams(teamsData.teams);
      }

      // ✅ 3. Carregar students (com fallback para Mock API)
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
          console.log('[FormadorDashboard] ✅ Estudantes recebidos do backend');
        }
      } catch (fetchError) {
        console.log('[FormadorDashboard] ⚠️ Backend não disponível para estudantes, usando Mock API...');
      }
      
      // Fallback para Mock API se backend falhou
      if (!studentsData || !studentsData.success) {
        studentsData = await mockAPI.getStudents();
        console.log('[FormadorDashboard] ✅ Estudantes recebidos do Mock API');
      }
      
      if (studentsData?.success && Array.isArray(studentsData.students)) {
        setStudents(studentsData.students);
      }

      // ✅ 4. Carregar sprints (com fallback para Mock API)
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
          console.log('[FormadorDashboard] ✅ Sprints recebidos do backend');
        }
      } catch (fetchError) {
        console.log('[FormadorDashboard] ⚠️ Backend não disponível para sprints, usando Mock API...');
      }
      
      // Fallback para Mock API se backend falhou
      if (!sprintsData || !sprintsData.success) {
        sprintsData = await mockAPI.getSprints();
        console.log('[FormadorDashboard] ✅ Sprints recebidos do Mock API');
      }
      
      if (sprintsData?.success && Array.isArray(sprintsData.sprints)) {
        setSprints(sprintsData.sprints);
      }

      // ✅ 5. Carregar user stories (com fallback para Mock API)
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
          console.log('[FormadorDashboard] ✅ Stories recebidas do backend');
        }
      } catch (fetchError) {
        console.log('[FormadorDashboard] ⚠️ Backend não disponível para stories, usando Mock API...');
      }
      
      // Fallback para Mock API se backend falhou
      if (!storiesData || !storiesData.success) {
        storiesData = await mockAPI.getStories();
        console.log('[FormadorDashboard] ✅ Stories recebidas do Mock API');
      }
      
      if (storiesData?.success && Array.isArray(storiesData.stories)) {
        setUserStories(storiesData.stories);
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
      
      // Calcular velocidade (story points concluídos)
      const completedStories = teamStories.filter(story => story.status === 'done');
      const velocity = completedStories.reduce((sum, story) => sum + (story.points || 0), 0);
      
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

  // Mock data - Burndown Chart (filtrável)
  const getBurndownData = () => {
    // Dados diferentes baseados nos filtros
    const baseData = [
      { id: 'burndown-day-0', day: 'Dia 1', ideal: 100, real: 100 },
      { id: 'burndown-day-1', day: 'Dia 2', ideal: 90, real: 95 },
      { id: 'burndown-day-2', day: 'Dia 3', ideal: 80, real: 88 },
      { id: 'burndown-day-3', day: 'Dia 4', ideal: 70, real: 78 },
      { id: 'burndown-day-4', day: 'Dia 5', ideal: 60, real: 65 },
      { id: 'burndown-day-5', day: 'Dia 6', ideal: 50, real: 52 },
      { id: 'burndown-day-6', day: 'Dia 7', ideal: 40, real: 40 },
      { id: 'burndown-day-7', day: 'Dia 8', ideal: 30, real: 28 },
      { id: 'burndown-day-8', day: 'Dia 9', ideal: 20, real: 18 },
      { id: 'burndown-day-9', day: 'Dia 10', ideal: 10, real: 10 },
      { id: 'burndown-day-10', day: 'Dia 11', ideal: 0, real: 5 },
    ];
    
    // Ajusta os dados baseado na equipa selecionada
    if (selectedTeam === '1') { // Alpha - melhor performance
      return baseData.map(d => ({ ...d, real: Math.max(0, d.real - 5) }));
    } else if (selectedTeam === '3') { // Gamma - pior performance
      return baseData.map(d => ({ ...d, real: Math.min(100, d.real + 8) }));
    }
    return baseData;
  };

  // Mock data - Velocity Chart (filtrável)
  const getVelocityData = () => {
    const data: Record<string, any[]> = {
      'all': [
        { id: 'velocity-all-1', sprint: 'S1', planeado: 45, concluido: 42 },
        { id: 'velocity-all-2', sprint: 'S2', planeado: 50, concluido: 48 },
        { id: 'velocity-all-3', sprint: 'S3', planeado: 55, concluido: 52 },
        { id: 'velocity-all-4', sprint: 'S4', planeado: 50, concluido: 55 },
        { id: 'velocity-all-5', sprint: 'S5', planeado: 60, concluido: 58 },
      ],
      '1': [ // forScrum
        { id: 'velocity-1-1', sprint: 'S1', planeado: 50, concluido: 48 },
        { id: 'velocity-1-2', sprint: 'S2', planeado: 55, concluido: 52 },
        { id: 'velocity-1-3', sprint: 'S3', planeado: 60, concluido: 58 },
        { id: 'velocity-1-4', sprint: 'S4', planeado: 55, concluido: 60 },
        { id: 'velocity-1-5', sprint: 'S5', planeado: 65, concluido: 63 },
      ],
      '2': [ // Product Owner
        { id: 'velocity-2-1', sprint: 'S1', planeado: 42, concluido: 40 },
        { id: 'velocity-2-2', sprint: 'S2', planeado: 48, concluido: 46 },
        { id: 'velocity-2-3', sprint: 'S3', planeado: 52, concluido: 50 },
        { id: 'velocity-2-4', sprint: 'S4', planeado: 48, concluido: 52 },
        { id: 'velocity-2-5', sprint: 'S5', planeado: 58, concluido: 55 },
      ],
      '3': [ // Agile Fundamentals
        { id: 'velocity-3-1', sprint: 'S1', planeado: 40, concluido: 38 },
        { id: 'velocity-3-2', sprint: 'S2', planeado: 45, concluido: 42 },
        { id: 'velocity-3-3', sprint: 'S3', planeado: 48, concluido: 45 },
        { id: 'velocity-3-4', sprint: 'S4', planeado: 45, concluido: 48 },
        { id: 'velocity-3-5', sprint: 'S5', planeado: 52, concluido: 50 },
      ],
    };
    return data[selectedCourse] || data['all'];
  };

  // KPIs principais (calculados baseados nos filtros)
  const getKPIs = () => {
    const kpisData: Record<string, any> = {
      'all': {
        velocity: 52,
        velocityTrend: '+8%',
        completionRate: 94,
        completionTrend: '+2%',
        activeTeams: 7,
        teamsTrend: '+1',
        avgPoints: 156,
        pointsTrend: '+12',
      },
      '1': { // Scrum Master
        velocity: 58,
        velocityTrend: '+10%',
        completionRate: 96,
        completionTrend: '+3%',
        activeTeams: 3,
        teamsTrend: '+1',
        avgPoints: 174,
        pointsTrend: '+15',
      },
      '2': { // Product Owner
        velocity: 50,
        velocityTrend: '+7%',
        completionRate: 92,
        completionTrend: '+2%',
        activeTeams: 2,
        teamsTrend: '0',
        avgPoints: 150,
        pointsTrend: '+10',
      },
      '3': { // Agile Fundamentals
        velocity: 45,
        velocityTrend: '+5%',
        completionRate: 88,
        completionTrend: '+1%',
        activeTeams: 2,
        teamsTrend: '+1',
        avgPoints: 135,
        pointsTrend: '+8',
      },
    };
    return kpisData[selectedCourse] || kpisData['all'];
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
  
  const burndownData = getBurndownData();
  const velocityData = getVelocityData();
  const kpis = getKPIs();

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
            <div className="bg-[#4aa540] p-2 rounded-[10px] w-fit mb-3 mx-auto">
              <BookOpen className="text-white" size={20} />
            </div>
            <p className="text-[13px] text-slate-800 dark:text-slate-200 text-center">Gerir Cursos</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 text-center">
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
            <p className="text-[13px] text-slate-800 dark:text-slate-200 text-center">Alertas</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 text-center">Gerir</p>
          </button>

          <button
            onClick={() => onNavigate?.('calendar')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-shadow text-left dark:bg-slate-800"
            aria-label="Calendário"
          >
            <div className="bg-purple-600 p-2 rounded-[10px] w-fit mb-3 mx-auto">
              <Calendar className="text-white" size={20} />
            </div>
            <p className="text-[13px] text-slate-800 dark:text-slate-200 text-center">Calendário</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 text-center">Ver</p>
          </button>

          <button
            onClick={() => onNavigate?.('messages')}
            className="bg-white rounded-[14px] p-4 shadow-sm hover:shadow-md transition-shadow text-left dark:bg-slate-800"
            aria-label="Mensagens"
          >
            <div className="bg-[#0b87ac] p-2 rounded-[10px] w-fit mb-3 mx-auto">
              <MessageSquare className="text-white" size={20} />
            </div>
            <p className="text-[13px] text-slate-800 dark:text-slate-200 text-center">Mensagens</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 text-center">{unreadMessages}</p>
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[12px] text-slate-600 dark:text-slate-400 mb-2 block">Curso</label>
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-[12px] px-3 py-2 text-[14px] text-slate-800 appearance-none cursor-pointer pr-8 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
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
            <label className="text-[12px] text-slate-600 dark:text-slate-400 mb-2 block">Equipa</label>
            <div className="relative">
              <select
                value={selectedTeam}
                onChange={(e) => {
                  const newTeam = e.target.value;
                  console.log(`[FormadorDashboard] 🎯 MUDOU EQUIPA: "${newTeam}"`);
                  setSelectedTeam(newTeam);
                }}
                className="w-full bg-white border-2 border-slate-200 rounded-[12px] px-3 py-2 text-[14px] text-slate-800 appearance-none cursor-pointer pr-8 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
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

        {/* Burndown Chart */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] text-slate-800 dark:text-slate-200">Burndown Chart</h2>
            <div className="bg-blue-100 px-3 py-1 rounded-[8px] dark:bg-blue-900/30">
              <p className="text-[11px] text-blue-700 dark:text-blue-400">Sprint Atual</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200} key={`burndown-formador-${burndownData.length}-${burndownData[0]?.real || 0}`}>
            <LineChart data={burndownData}>
              <CartesianGrid key="grid-burndown-formador" strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                key="xaxis-burndown-formador"
                dataKey="day" 
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <YAxis 
                key="yaxis-burndown-formador"
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <Tooltip 
                key="tooltip-burndown-formador"
                contentStyle={{ 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  fontSize: '12px'
                }}
              />
              <Legend 
                key="legend-burndown-formador"
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Line 
                key="line-ideal-burndown-formador"
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
                key="line-real-burndown-formador"
                type="monotone" 
                dataKey="real" 
                stroke="#4aa540" 
                strokeWidth={3}
                name="Real"
                dot={{ fill: '#4aa540', r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#4aa540] rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">Trabalho Restante: <strong className="text-slate-800 dark:text-slate-200">5 pts</strong></span>
              </div>
              <span className="text-green-600 dark:text-green-400">No prazo ✓</span>
            </div>
          </div>
        </div>

        {/* Velocity Chart */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] text-slate-800 dark:text-slate-200">Velocidade por Sprint</h2>
            <BarChart3 className="text-[#4aa540]" size={20} />
          </div>

          <ResponsiveContainer width="100%" height={200} key={`velocity-formador-${velocityData.length}-${velocityData[0]?.concluido || 0}`}>
            <BarChart data={velocityData}>
              <CartesianGrid key="grid-velocity-formador" strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                key="xaxis-velocity-formador"
                dataKey="sprint" 
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <YAxis 
                key="yaxis-velocity-formador"
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <Tooltip 
                key="tooltip-velocity-formador"
                contentStyle={{ 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  fontSize: '12px'
                }}
              />
              <Legend key="legend-velocity-formador" wrapperStyle={{ fontSize: '12px' }} />
              <Bar 
                key="bar-planeado-velocity-formador"
                dataKey="planeado" 
                fill="#94a3b8" 
                radius={[8, 8, 0, 0]}
                name="Planeado"
                isAnimationActive={false}
              />
              <Bar 
                key="bar-concluido-velocity-formador"
                dataKey="concluido" 
                fill="#4aa540" 
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
                <strong className="text-[#4aa540] text-[16px]">52 pts</strong>
                <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-[6px] dark:bg-green-900/30">
                  <TrendingUp size={12} className="text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400 text-[11px]">+8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance por Equipa */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800">
          <h2 className="text-[16px] text-slate-800 dark:text-slate-200 mb-4">Performance por Equipa</h2>
          
          {loading ? (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-[13px]">Carregando equipas...</div>
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
                const barColor = ['#4aa540', '#0b87ac', 'rgb(147 51 234)', '#f97316', '#ec4899', '#06b6d4'][index % 6];
                
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
                        <div className={`w-8 h-8 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center text-white text-[11px]`}>
                          {initials}
                        </div>
                        <div>
                          <p className="text-[14px] text-slate-800 dark:text-slate-200">{team.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{team.courseName || 'Sem Curso'} • {team.memberCount} membros</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[16px]" style={{ color: barColor }}>{team.velocity} pts</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Velocidade</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                      <div 
                        className="h-2 rounded-full transition-all" 
                        style={{ width: `${team.completionRate}%`, backgroundColor: barColor }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{team.completionRate}% de conclusão</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-[13px]">Nenhuma equipa encontrada</div>
          )}
        </div>
      </div>
    </div>
  );
}
