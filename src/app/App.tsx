import { useState, useEffect } from 'react';
import { User, AlertCircle, CheckCircle, GraduationCap, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import svgPaths from './imports/svg-qi3x6nzkk2';
import { projectId, publicAnonKey } from './utils/supabase/info';

// Context and Components
import { AppProvider, useApp } from './context/AppContext';
import { BottomNav } from './components/shared/BottomNav';
import { FormadorDashboard } from './components/FormadorDashboard';
import { FormandoDashboard } from './components/FormandoDashboard';
import { SprintBoard } from './components/SprintBoard';
import { CreateSprint } from './components/CreateSprint';
import { CreateUserStory } from './components/CreateUserStory';
import { CreateTeam } from './components/CreateTeam';
import { CreateStudent } from './components/CreateStudent';
import { TurmaDetails } from './components/TurmaDetails';
import { UserStoryDetails } from './components/UserStoryDetails';
import { ProfileSettings } from './components/ProfileSettings';
import { Messages } from './components/Messages';
import { Alerts } from './components/Alerts';
import { MessagesFormando } from './components/MessagesFormando';
import { CalendarView } from './components/CalendarView';
import { SprintList } from './components/SprintList';
import { ScrumPoker } from './components/ScrumPoker';
import { CourseManagement } from './components/CourseManagement';
import { ManageSprintStories } from './components/ManageSprintStories';
import { ManageAlerts } from './components/ManageAlerts';
import { CourseDetails } from './components/CourseDetails';
import { FormandoSprints } from './components/FormandoSprints';
import { ConnectionStatus } from './components/ConnectionStatus';

function SsoIcon() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="SSO Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="SSO Icon">
          <path clipRule="evenodd" d={svgPaths.p2c309900} fill="var(--fill-0, #4285F4)" fillRule="evenodd" id="Shape" />
          <path clipRule="evenodd" d={svgPaths.p5439c80} fill="var(--fill-0, #34A853)" fillRule="evenodd" id="Shape_2" />
          <path clipRule="evenodd" d={svgPaths.p3b443800} fill="var(--fill-0, #FBBC05)" fillRule="evenodd" id="Shape_3" />
          <path clipRule="evenodd" d={svgPaths.p39a0e280} fill="var(--fill-0, #EA4335)" fillRule="evenodd" id="Shape_4" />
          <g id="Shape_5"></g>
        </g>
      </svg>
    </div>
  );
}

function AppleLogo() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Apple Logo">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Apple Logo">
          <rect fill="var(--fill-0, #979191)" height="24" rx="12" width="24" />
          <path d={svgPaths.p2c445b80} fill="var(--fill-0, #FFFCFC)" id="path4" />
        </g>
      </svg>
    </div>
  );
}

type UserType = 'formador' | 'formando' | null;

// Componente que tem acesso ao contexto
function AppContent({
  userType,
  currentScreen,
  handleBackToDashboard,
  handleLogout,
  handleNavigate,
  selectedCourseName,
  selectedCourseId,
  selectedTeamId,
  courseInitialTab,
  loggedStudentData,
  selectedSprintId,
  sprintBoardKey,
  createTeamParams,
  setCreateTeamParams,
  navigationParams
}: {
  userType: UserType;
  currentScreen: string;
  handleBackToDashboard: () => void;
  handleLogout: () => void;
  handleNavigate: (screen: string, params?: any) => void;
  selectedCourseName: string;
  selectedCourseId: string;
  selectedTeamId: string | null;
  courseInitialTab: 'overview' | 'teams' | 'sprints' | 'stories';
  loggedStudentData: any;
  selectedSprintId: string | null;
  sprintBoardKey: number;
  createTeamParams: { courseId: string; courseName: string } | null;
  setCreateTeamParams: (params: { courseId: string; courseName: string } | null) => void;
  navigationParams: any;
}) {
  try {
    const { setUserType, theme, setLoggedStudent, setUserProfile, setSelectedCourse, fontSize, previousScreen } = useApp();
    
    // Define o userType no contexto
    useEffect(() => {
      if (userType !== null) {
        try {
          setUserType(userType);
        } catch (error) {
          console.error('[ERROR] Erro ao definir userType:', error);
        }
      }
    }, [userType]);

    // Define os dados do formando logado E atualiza o userProfile
    useEffect(() => {
      try {
        if (loggedStudentData) {
          setLoggedStudent(loggedStudentData);
          
          // Atualizar o userProfile com os dados do formando
          const studentInitials = loggedStudentData.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
          
          setUserProfile({
            name: loggedStudentData.name,
            email: loggedStudentData.email || `${loggedStudentData.name.toLowerCase().replace(/\s/g, '')}@formando.com`,
            phone: loggedStudentData.phone || '',
            location: loggedStudentData.location || '',
            bio: 'Formando',
            expertise: loggedStudentData.teamName ? `Equipa ${loggedStudentData.teamName}` : 'Estudante',
            avatar: studentInitials,
          });

          // Atualizar o curso selecionado com os dados do formando
          if (loggedStudentData.courseId && loggedStudentData.courseName) {
            setSelectedCourse({
              id: loggedStudentData.courseId,
              name: loggedStudentData.courseName,
            });
          }
        } else if (userType === 'formador') {
          // Restaurar perfil do formador quando não há formando logado
          setUserProfile({
            name: 'Carlos Luís',
            email: 'ccluis@gmail.com',
            phone: '+351 966 224 649',
            location: 'Coimbra, Portugal',
            bio: 'Formador',
            expertise: 'Educação de Adultos',
            avatar: 'CL',
          });
        }
      } catch (error) {
        console.error('[ERROR] Erro ao atualizar perfil de utilizador:', error);
      }
    }, [loggedStudentData, userType]);

    // Apply theme and fontSize classes to html element
    useEffect(() => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      
      // Apply font size classes
      root.classList.remove('font-size-normal', 'font-size-large', 'font-size-extra-large');
      root.classList.add(`font-size-${fontSize}`);
      
      // Set language attribute for VoiceOver and screen readers
      root.setAttribute('lang', 'pt-PT');
    }, [theme, fontSize]);

    return (
      <div className="relative">
        {/* Render screens based on currentScreen */}
        {(() => {
          switch (currentScreen) {
            case 'profile':
              return <ProfileSettings onBack={handleBackToDashboard} onLogout={handleLogout} />;
            case 'messages':
              return <MessagesFormando onBack={handleBackToDashboard} />;
            case 'alerts':
              return <Alerts onNavigate={handleNavigate} />;
            case 'messagesFormando':
              return <MessagesFormando onBack={handleBackToDashboard} />;
            case 'calendar':
              return <CalendarView onNavigate={handleNavigate} />;
            case 'courseManagement':
              return <CourseManagement onBack={handleBackToDashboard} onNavigate={handleNavigate} />;
            case 'manageAlerts':
              return <ManageAlerts onBack={handleBackToDashboard} />;
            case 'courseDetails':
              // Se for formando, mostrar FormandoSprints; se for formador, mostrar CourseDetails
              if (userType === 'formando') {
                console.log('[App.tsx RENDER] Renderizando FormandoSprints para formando');
                return (
                  <FormandoSprints 
                    onBack={handleBackToDashboard}
                    onNavigate={(screen, params) => handleNavigate(screen, params)}
                  />
                );
              }
              
              // Formador: CourseDetails normal
              console.log('[App.tsx RENDER] Renderizando CourseDetails com courseId:', selectedCourseId, 'courseName:', selectedCourseName);
              return (
                <CourseDetails 
                  key={selectedCourseId} // FORÇA RELOAD quando muda de curso
                  onBack={handleBackToDashboard}
                  onNavigate={(screen, params) => handleNavigate(screen, params)}
                  courseName={selectedCourseName}
                  courseId={selectedCourseId}
                  initialTab={courseInitialTab}
                  userType={userType}
                />
              );
            case 'manageSprintStories':
              return selectedSprintId ? (
                <ManageSprintStories
                  sprintId={selectedSprintId}
                  sprintName={selectedCourseName}
                  onBack={() => handleNavigate('sprintBoard')}
                />
              ) : null;
            case 'sprintBoard':
              console.log('🎬🎬🎬 ════════════════════════════════════════════════');
              console.log('[App.tsx RENDER] 🎬 RENDERIZANDO SPRINTBOARD');
              console.log('[App.tsx RENDER] userType:', userType);
              console.log('[App.tsx RENDER] selectedSprintId:', selectedSprintId);
              console.log('[App.tsx RENDER] navigationParams:', navigationParams);
              console.log('[App.tsx RENDER] navigationParams.sprintId:', navigationParams?.sprintId);
              console.log('[App.tsx RENDER] loggedStudentData?.teamId:', loggedStudentData?.teamId);
              console.log('[App.tsx RENDER] sprintBoardKey:', sprintBoardKey);
              console.log('🎬🎬🎬 ════════════════════════════════════════════════');
              
              // USAR navigationParams.sprintId se disponível, senão usar selectedSprintId
              const sprintIdToUse = navigationParams?.sprintId || selectedSprintId;
              console.log('[App.tsx RENDER] 🎯 SPRINT ID FINAL A USAR:', sprintIdToUse);
              
              return <SprintBoard 
                userType={userType as 'formador' | 'formando'} 
                onBack={() => userType === 'formando' ? handleNavigate('courseDetails') : handleNavigate('courseDetails', { tab: 'sprints' })} 
                onCreateStory={() => handleNavigate('createUserStory')} 
                onNavigate={handleNavigate} 
                sprintId={sprintIdToUse || undefined}
                teamId={loggedStudentData?.teamId || undefined}
                key={sprintBoardKey} 
              />;
            case 'scrumPoker':
              return <ScrumPoker onBack={() => handleNavigate('sprintBoard')} />;
            case 'createSprint':
              return <CreateSprint onBack={() => handleNavigate('courseDetails', { tab: 'sprints' })} />;
            case 'createUserStory':
              return <CreateUserStory onBack={() => handleNavigate('courseDetails', { tab: 'stories' })} />;
            case 'createTeam':
              // Usar createTeamParams se disponível, caso contrário usar selectedCourseId
              const teamCourseId = createTeamParams?.courseId || selectedCourseId;
              const teamCourseName = createTeamParams?.courseName || selectedCourseName;
              console.log('[App.tsx RENDER] Renderizando CreateTeam com courseId:', teamCourseId, 'de createTeamParams:', createTeamParams);
              return <CreateTeam 
                courseId={teamCourseId} 
                onBack={() => {
                  console.log('[App.tsx CreateTeam.onBack] Voltando para courseDetails com courseId:', teamCourseId);
                  // NÃO limpar createTeamParams aqui - manter para garantir que o courseId seja preservado
                  handleNavigate('courseDetails', { 
                    tab: 'teams',
                    courseId: teamCourseId, // PASSAR O COURSEID EXPLICITAMENTE
                    courseName: teamCourseName
                  });
                  // Limpar DEPOIS de navegar
                  setCreateTeamParams(null);
                }} 
              />;
            case 'createStudent':
              return <CreateStudent courseId={selectedCourseId} courseName={selectedCourseName} onBack={() => handleNavigate('courseDetails', { tab: 'students' })} />;
            case 'turmaDetails':
              return <TurmaDetails 
                onBack={() => handleNavigate('courseDetails', { tab: 'teams' })} 
                courseName={selectedCourseName} 
                onNavigate={handleNavigate} 
                teamId={selectedTeamId}
              />;
            case 'userStoryDetails':
              return <UserStoryDetails userType={userType as 'formador' | 'formando'} onBack={() => handleNavigate(previousScreen || 'sprintBoard')} onNavigate={handleNavigate} />;
            case 'dashboard':
            default:
              if (userType === 'formador') {
                return <FormadorDashboard onLogout={handleLogout} onNavigate={handleNavigate} />;
              } else {
                return <FormandoDashboard onLogout={handleLogout} onNavigate={handleNavigate} />;
              }
          }
        })()}

        {/* Bottom Navigation - sempre presente exceto em telas de criação/detalhe full screen */}
        {!['createUserStory', 'createTeam', 'createStudent', 'createSprint', 'scrumPoker'].includes(currentScreen) && (
          <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} onLogout={handleLogout} />
        )}
      </div>
    );
  } catch (error) {
    console.error('[ERROR] Erro ao renderizar AppContent:', error);
    return <div className="relative">
      <p className="text-red-500 text-center mt-10">Ocorreu um erro ao renderizar a tela. Tente novamente mais tarde.</p>
    </div>;
  }
}

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{username?: string; password?: string}>({});
  const [touched, setTouched] = useState<{username?: boolean; password?: boolean}>({});
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState(''); // NOVO: Erro de login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [selectedCourseName, setSelectedCourseName] = useState<string>(''); // Nome do curso selecionado - SEM VALOR PADRÃO
  const [selectedCourseId, setSelectedCourseId] = useState<string>(''); // ID do curso selecionado - SEM VALOR PADRÃO
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [courseInitialTab, setCourseInitialTab] = useState<'overview' | 'teams' | 'sprints' | 'stories'>('overview');
  const [loggedStudentData, setLoggedStudentData] = useState<any>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [sprintBoardKey, setSprintBoardKey] = useState(0); // Key para forçar reload do SprintBoard
  const [createTeamParams, setCreateTeamParams] = useState<{ courseId: string; courseName: string } | null>(null); // NOVO: Guardar params do createTeam
  const [navigationParams, setNavigationParams] = useState<any>({}); // NOVO: Guardar params de navegação

  // Validação do nome de utilizador
  const validateUsername = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Nome de utilizador é obrigatório';
    }
    // Não validar aqui se é formador ou formando - isso será verificado no backend
    return undefined;
  };

  // Validação da password
  const validatePassword = (value: string): string | undefined => {
    // Password é opcional para formandos (será validado no backend)
    return undefined;
  };

  // Atualizar campo e validar
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setLoginError(''); // Limpar erro de login quando utilizador digitar
    if (touched.username) {
      const error = validateUsername(value);
      setErrors(prev => ({ ...prev, username: error }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(''); // Limpar erro quando utilizador digitar
    if (touched.password) {
      const error = validatePassword(value);
      setErrors(prev => ({ ...prev, password: error }));
    }
  };

  // Marcar campo como tocado ao perder foco
  const handleUsernameBlur = () => {
    setTouched(prev => ({ ...prev, username: true }));
    const error = validateUsername(username);
    setErrors(prev => ({ ...prev, username: error }));
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    const error = validatePassword(password);
    setErrors(prev => ({ ...prev, password: error }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campo username vazio PRIMEIRO
    if (!username.trim()) {
      toast.error('Por favor, insira o nome de utilizador.');
      return;
    }

    // Marcar como loading
    setIsLoading(true);
    setTouched({ username: true, password: true });
    
    try {
      const trimmedUsername = username.trim();
      
      // Verificar se é "Formador" (case-insensitive)
      if (trimmedUsername.toLowerCase() === 'formador') {
        // Login como formador - NÃO PRECISA DE PASSWORD
        setTimeout(() => {
          setIsLoading(false);
          setUserType('formador');
          toast.success('Bem-vindo, Formador!');
          setIsLoggedIn(true);
        }, 1000);
        return;
      }
      
      // Se não é formador, é formando - NÃO PRECISA MAIS DE PASSWORD
      // Buscar formando cadastrado no backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/students`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao verificar formandos');
      }

      const data = await response.json();
      
      console.log('[LOGIN DEBUG] 📋 Lista de formandos recebidos:', data.students?.map((s: any) => ({ 
        id: s.id, 
        name: s.name, 
        courseId: s.courseId,
        teamId: s.teamId 
      })));
      
      if (data.success && Array.isArray(data.students)) {
        // Procurar formando com nome correspondente (case-insensitive)
        const student = data.students.find((s: any) => 
          s.name.toLowerCase() === trimmedUsername.toLowerCase()
        );
        
        if (!student) {
          // Formando NÃO encontrado
          setIsLoading(false);
          setLoginError('Nome de formando não encontrado. Verifique se está inscrito no sistema.');
          console.log('[LOGIN DEBUG] ❌ Formando NÃO encontrado. Username buscado:', trimmedUsername);
          console.log('[LOGIN DEBUG] 📋 Formandos disponíveis:', data.students.map((s: any) => s.name));
          return;
        }
        
        console.log('[LOGIN DEBUG] ✅ Formando encontrado!', {
          id: student.id,
          name: student.name,
          courseId: student.courseId,
          teamId: student.teamId
        });
        console.log('[DEBUG] Formando encontrado, buscando dados adicionais...');
        
        // Buscar nome do curso
        let courseName = 'Sem Curso';
        if (student.courseId) {
          try {
            console.log('[DEBUG] Buscando curso:', student.courseId);
            const courseResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/courses/${student.courseId}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            
            console.log('[DEBUG] Response status do curso:', courseResponse.status);
            
            if (courseResponse.ok) {
              const courseData = await courseResponse.json();
              console.log('[DEBUG] Resposta do curso:', courseData);
              
              if (courseData.success && courseData.course) {
                courseName = courseData.course.name;
                console.log('[DEBUG] ✅ Curso encontrado:', courseName);
              } else {
                console.log('[DEBUG] ⚠️ Curso não retornado pelo backend (success=false ou course vazio)');
                courseName = 'Curso Inexistente';
              }
            } else if (courseResponse.status === 404) {
              console.log('[DEBUG] ❌ Curso NÃO EXISTE (404) - courseId:', student.courseId);
              courseName = 'Curso Inexistente';
            } else {
              console.log('[DEBUG] ❌ Erro na resposta do curso:', courseResponse.status);
              courseName = 'Erro ao carregar curso';
            }
          } catch (err) {
            console.error('[DEBUG] ❌ Erro ao buscar curso:', err);
            courseName = 'Erro ao carregar curso';
          }
        } else {
          console.log('[DEBUG] ⚠️ Formando sem courseId associado');
          courseName = 'Sem Curso';
        }

        // Buscar nome da equipa
        let teamName = 'Sem Equipa';
        if (student.teamId) {
          try {
            console.log('[DEBUG] Buscando equipa:', student.teamId);
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
              const teamsData = await teamsResponse.json();
              if (teamsData.success && Array.isArray(teamsData.teams)) {
                const team = teamsData.teams.find((t: any) => t.id === student.teamId);
                if (team) {
                  teamName = team.name;
                  console.log('[DEBUG] Equipa encontrada:', teamName);
                } else {
                  console.log('[DEBUG] Equipa não encontrada na lista');
                }
              }
            } else {
              console.log('[DEBUG] Erro na resposta das equipas:', teamsResponse.status);
            }
          } catch (err) {
            console.error('[DEBUG] Erro ao buscar equipa:', err);
          }
        } else {
          console.log('[DEBUG] Formando sem teamId');
        }

        // Enriquecer dados do formando com nomes
        const enrichedStudent = {
          ...student,
          courseName,
          teamName
        };

        console.log('[DEBUG] Dados do formando enriquecidos:', enrichedStudent);

        setTimeout(() => {
          setIsLoading(false);
          setUserType('formando');
          toast.success(`Bem-vindo, ${student.name}!`);
          setIsLoggedIn(true);
          setLoggedStudentData(enrichedStudent);
        }, 1000);
        return;
      }
      
      // Se chegou aqui, o nome não foi encontrado
      setIsLoading(false);
      toast.error('Erro ao carregar dados. Digite "Formador" ou o nome de um formando cadastrado.');
      
    } catch (error) {
      console.error('Erro no login:', error);
      setIsLoading(false);
      toast.error('Erro ao realizar login. Tente novamente.');
    }
  };

  const handleGoogleLogin = () => {
    toast.info('Login com Google em desenvolvimento');
    console.log('Google login clicked');
  };

  const handleAppleLogin = () => {
    toast.info('Login com Apple em desenvolvimento');
    console.log('Apple login clicked');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setUserType(null);
    setTouched({});
    setErrors({});
    setCurrentScreen('dashboard');
    setLoggedStudentData(null);
  };

  // Função para navegar entre ecrãs
  const handleNavigate = (screen: string, params?: any) => {
    console.log('🚀🚀🚀 ════════════════════════════════════════════════');
    console.log('[App.tsx handleNavigate] 🎯 Navegando para:', screen);
    console.log('[App.tsx handleNavigate] 📦 Params recebidos:', params);
    console.log('🚀🚀🚀 ════════════════════════════════════════════════');
    
    // LIMPAR navigationParams SEMPRE (exceto se passamos novos params)
    if (params) {
      console.log('[App.tsx handleNavigate] ✅ Guardando params:', params);
      setNavigationParams(params);
    } else {
      console.log('[App.tsx handleNavigate] 🧹 Limpando params antigos');
      setNavigationParams({});
    }
    
    // Se navegando para sprintBoard, incrementar key para forçar reload
    if (screen === 'sprintBoard') {
      console.log('🏁 NAVEGANDO PARA SPRINTBOARD!');
      console.log('🏁 sprintBoardKey ANTES:', sprintBoardKey);
      setSprintBoardKey(prev => {
        console.log('🏁 sprintBoardKey DEPOIS:', prev + 1);
        return prev + 1;
      });
      
      // Capturar sprintId se passado
      if (params?.sprintId) {
        console.log('🎯 SprintId recebido nos params:', params.sprintId);
        console.log(' Setando selectedSprintId...');
        setSelectedSprintId(params.sprintId);
        console.log('🎯 selectedSprintId setado para:', params.sprintId);
      } else {
        console.log('⚠️ AVISO: Nenhum sprintId nos params!');
      }
    }
    
    // Se o formador clicar em 'courses', redirecionar para 'courseManagement'
    if (screen === 'courses' && userType === 'formador') {
      setCurrentScreen('courseManagement');
      return;
    }
    
    // Se o formando clicar em 'courses', redirecionar para 'courseDetails'
    if (screen === 'courses' && userType === 'formando') {
      setCurrentScreen('courseDetails');
      setCourseInitialTab('overview');
      return;
    }

    if (screen === 'turmaDetails' && params?.teamId) {
      setSelectedTeamId(params.teamId);
    }

    if (screen === 'SprintDetails' && params?.sprintId) {
      setSelectedSprintId(params.sprintId);
    }

    if (screen === 'manageSprintStories' && params?.sprintId) {
      setSelectedSprintId(params.sprintId);
    }
    
    if (screen === 'courseDetails') {
      // Se vem do CourseManagement, params tem courseId e courseName
      console.log('════════════════════════════════════════════════');
      console.log('[App.tsx handleNavigate] NAVEGANDO PARA COURSEDETAILS');
      console.log('[App.tsx handleNavigate] params recebidos:', params);
      console.log('[App.tsx handleNavigate] params.courseId:', params?.courseId);
      console.log('[App.tsx handleNavigate] params.courseName:', params?.courseName);
      console.log('[App.tsx handleNavigate] selectedCourseId ATUAL:', selectedCourseId);
      
      if (params?.courseId) {
        console.log('[App.tsx handleNavigate] ✓ Setando selectedCourseId:', params.courseId);
        setSelectedCourseId(params.courseId);
      } else {
        console.log('[App.tsx handleNavigate] ⚠️ AVISO: params.courseId está vazio, mantendo selectedCourseId atual:', selectedCourseId);
      }
      
      if (params?.courseName) {
        console.log('[App.tsx handleNavigate] ✓ Setando selectedCourseName:', params.courseName);
        setSelectedCourseName(params.courseName);
      } else {
        console.log('[App.tsx handleNavigate] ⚠️ AVISO: params.courseName está vazio, mantendo selectedCourseName atual:', selectedCourseName);
      }
      
      if (params?.tab) {
        setCourseInitialTab(params.tab);
      } else {
        // Default to overview se não especificado
        setCourseInitialTab('overview');
      }
      console.log('[App.tsx handleNavigate] selectedCourseId DEPOIS:', selectedCourseId);
      console.log('════════════════════════════════════════════════');
    }

    // Se for createStudent, armazenar courseId e courseName
    if (screen === 'createStudent' && params) {
      if (params.courseId) setSelectedCourseId(params.courseId);
      if (params.courseName) setSelectedCourseName(params.courseName);
    }

    // Se for createTeam, armazenar courseId e courseName IMEDIATAMENTE
    if (screen === 'createTeam' && params) {
      console.log('[App.tsx handleNavigate] createTeam params:', params);
      if (params.courseId) {
        console.log('[App.tsx handleNavigate] Setando selectedCourseId IMEDIATAMENTE:', params.courseId);
        // Usar callback para garantir que o valor seja atualizado ANTES de mudar de tela
        setSelectedCourseId(params.courseId);
      } else {
        console.log('[App.tsx handleNavigate] ⚠️ ERRO CRÍTICO: createTeam sem courseId nos params!');
      }
      if (params.courseName) {
        console.log('[App.tsx handleNavigate] Setando selectedCourseName para createTeam:', params.courseName);
        setSelectedCourseName(params.courseName);
      }
      // Guardar params para uso posterior no CreateTeam
      setCreateTeamParams(params);
    }

    // Mudar a tela por último
    setCurrentScreen(screen);
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  // Dashboard após login
  if (isLoggedIn && userType) {
    return (
      <AppProvider>
        <Toaster 
          position="top-center" 
          richColors 
          closeButton 
          expand={false}
          visibleToasts={3}
          toastOptions={{
            style: {
              marginTop: '80px',
            },
          }}
        />
        <ConnectionStatus />
        <AppContent 
          userType={userType}
          currentScreen={currentScreen}
          handleBackToDashboard={handleBackToDashboard}
          handleLogout={handleLogout}
          handleNavigate={handleNavigate}
          selectedCourseName={selectedCourseName}
          selectedCourseId={selectedCourseId}
          selectedTeamId={selectedTeamId}
          courseInitialTab={courseInitialTab}
          loggedStudentData={loggedStudentData}
          selectedSprintId={selectedSprintId}
          sprintBoardKey={sprintBoardKey}
          createTeamParams={createTeamParams}
          setCreateTeamParams={setCreateTeamParams}
          navigationParams={navigationParams}
        />
      </AppProvider>
    );
  }

  // Tela de Login
  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <div className="bg-white min-h-screen w-full md:flex md:items-center md:justify-center font-['Roboto']">
        <div className="relative w-full min-h-screen md:min-h-0 md:h-[844px] md:max-w-md md:w-full md:shadow-2xl md:rounded-[40px] bg-white overflow-hidden">
          
          {/* Ilustração superior */}
          <div className="relative h-[280px] bg-gradient-to-br from-[#4aa540] to-[#3d8935] px-6 pt-20 pb-8 overflow-hidden">
            {/* Padrão decorativo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-12 left-8 w-24 h-24 border-4 border-white rounded-full" />
              <div className="absolute top-32 right-12 w-16 h-16 border-4 border-white rounded-full" />
              <div className="absolute bottom-8 left-16 w-20 h-20 border-4 border-white rounded-full" />
              <div className="absolute top-24 right-24 w-12 h-12 bg-white rounded-full" />
              <div className="absolute bottom-16 right-8 w-8 h-8 bg-white rounded-full" />
            </div>
            
            {/* Conteúdo */}
            <div className="relative z-10 text-center">
              <div className="inline-block mb-4">
                <div className="w-16 h-16 bg-white rounded-[18px] flex items-center justify-center shadow-lg">
                  <GraduationCap size={32} className="text-[#4aa540]" />
                </div>
              </div>
              <h1 className="text-white text-[36px] tracking-tight mb-1">
                Bem-vindo
              </h1>
              <p className="text-white/90 text-[15px]">
                Entre na plataforma forScrum
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="px-6 pt-8 pb-12">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Campo Nome do Utilizador */}
              <div className="flex flex-col gap-2">
                <label htmlFor="username" className="text-[14px] text-slate-600 font-medium">
                  Nome do utilizador
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={20} />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    onBlur={handleUsernameBlur}
                    className={`bg-white w-full rounded-[14px] border-2 ${
                      errors.username && touched.username
                        ? 'border-red-400 focus:border-red-500'
                        : !errors.username && touched.username && username
                        ? 'border-[#4aa540] focus:border-[#4aa540]'
                        : 'border-slate-200 focus:border-[#4aa540]'
                    } pl-12 pr-12 py-4 text-[16px] text-slate-800 focus:outline-none transition-all placeholder:text-slate-400 shadow-sm`}
                    placeholder="formador ou formando"
                  />
                  {touched.username && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {errors.username ? (
                        <AlertCircle size={20} className="text-red-500" />
                      ) : username ? (
                        <CheckCircle size={20} className="text-[#4aa540]" />
                      ) : null}
                    </div>
                  )}
                </div>
                {errors.username && touched.username && (
                  <div className="flex items-start gap-2 bg-red-50 rounded-[10px] px-3 py-2.5 border border-red-100">
                    <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-[13px] text-red-700">{errors.username}</p>
                  </div>
                )}
                {loginError && (
                  <div className="flex items-start gap-2 bg-red-50 rounded-[10px] px-3 py-2.5 border border-red-100">
                    <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-[13px] text-red-700">{loginError}</p>
                  </div>
                )}
                {!errors.username && !loginError && touched.username && username && (
                  <div className="flex items-start gap-2 bg-green-50 rounded-[10px] px-3 py-2.5 border border-green-200">
                    <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-[13px] text-green-700">
                      {username.toLowerCase() === 'formador' ? (
                        <span>Vai entrar como <strong>Formador</strong></span>
                      ) : (
                        <span>Vai entrar como <strong>Formando</strong></span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Campo Password - Opcional para todos */}
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-[14px] text-slate-600 font-medium">
                  Password (opcional)
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={20} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={handlePasswordBlur}
                    className="bg-white w-full rounded-[14px] border-2 border-slate-200 focus:border-[#4aa540] pl-12 pr-12 py-4 text-[16px] text-slate-800 focus:outline-none transition-all placeholder:text-slate-400 shadow-sm"
                    placeholder="Digite a sua password (opcional)"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar password" : "Mostrar password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Botão Login */}
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#4aa540] w-full h-[56px] rounded-[14px] text-[17px] text-white font-semibold hover:bg-[#3d8935] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#4aa540]/20 mt-8"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>A entrar...</span>
                  </div>
                ) : (
                  'Entrar na Plataforma'
                )}
              </button>
            </form>

            {/* Info */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-center gap-2 text-center">
                <div className="w-2 h-2 bg-[#4aa540] rounded-full" />
                <p className="text-[13px] text-slate-500">
                  forScrum - Aplicação de Ensino Scrum
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center px-6">
            <p className="text-[11px] text-slate-400">
              forScrum © 2025 
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
