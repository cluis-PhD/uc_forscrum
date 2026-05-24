import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Plus,
  Users,
  Layers,
  FileText,
  Settings,
  Target,
  ChevronRight,
  BarChart3,
  Search,
  MoreVertical,
  Mail,
  Pencil,
  Trash2,
  MessageSquare,
  CheckCircle,
  Award
} from 'lucide-react';
import { toast } from "sonner";
import { Header } from './shared/Header';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { BackendWarning } from './BackendWarning';
import { useApp } from '../context/AppContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { fetchWithRetry, formatErrorMessage, isNetworkError } from '../utils/apiRetry';

interface CourseDetailsProps {
  onBack: () => void;
  onNavigate?: (screen: string, params?: any) => void;
  courseName?: string; // Nome do curso dinâmico
  courseId?: string; // ID do curso
  initialTab?: 'overview' | 'teams' | 'sprints' | 'stories' | 'students';
  userType?: 'formador' | 'formando'; // Tipo de utilizador
}

export function CourseDetails({ onBack, onNavigate, courseName, courseId, initialTab = 'overview', userType = 'formador' }: CourseDetailsProps) {
  console.log('[CourseDetails] PROPS RECEBIDAS:', { courseName, courseId, initialTab, userType });
  
  const isFormador = userType === 'formador';
  console.log('[CourseDetails] isFormador calculado:', isFormador);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'sprints' | 'stories'>(initialTab);
  const { setSelectedUserStory, setSelectedCourse, setPreviousScreen } = useApp();
  
  // Modals state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isMessageStudentOpen, setIsMessageStudentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // Form states
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentTeamId, setStudentTeamId] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  
  // User stories from database
  const [stories, setStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  
  // Students from database
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Teams from database
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  
  // Sprints from database
  const [sprints, setSprints] = useState<any[]>([]);
  const [loadingSprints, setLoadingSprints] = useState(false);
  
  // Backend warning state
  const [showBackendWarning, setShowBackendWarning] = useState(false);
  const [dataLossDetected, setDataLossDetected] = useState(false);
  
  // Atualizar tab se a prop mudar
  useEffect(() => {
    setActiveTab(initialTab);
    // Se a tab mudou para students, recarregar a lista
    if (initialTab === 'students') {
      loadStudents();
    }
    // Se a tab mudou para teams, recarregar a lista
    if (initialTab === 'teams') {
      loadTeams();
    }
    // Se a tab mudou para sprints, recarregar a lista
    if (initialTab === 'sprints') {
      loadSprints();
    }
  }, [initialTab]);

  // Definir curso selecionado no contexto
  useEffect(() => {
    setSelectedCourse({ id: courseId, name: courseName });
  }, [courseName, courseId, setSelectedCourse]);

  // Log sempre que a lista de formandos mudar
  useEffect(() => {
    console.log('[studentsList] ===== LISTA DE FORMANDOS ATUALIZADA =====');
    console.log('[studentsList] Total:', studentsList.length);
    studentsList.forEach((s: any, idx: number) => {
      console.log(`[studentsList] ${idx + 1}.`, { id: s.id, name: s.name, email: s.email });
    });
    console.log('[studentsList] ===== FIM =====');
  }, [studentsList]);

  // Carregar user stories do servidor
  useEffect(() => {
    loadUserStories();
    loadStudents();
    loadTeams();
    loadSprints();
  }, []);

  const loadUserStories = async () => {
    try {
      setLoadingStories(true);
      
      const response = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        },
        {
          maxRetries: 3,
          delayMs: 1000,
          onRetry: (attempt, error) => {
            console.log(`[loadUserStories] Tentativa ${attempt}/3 - ${formatErrorMessage(error)}`);
            if (attempt === 1) {
              toast.info('⏳ A tentar reconectar ao servidor...', { duration: 2000 });
            }
          }
        }
      );

      console.log('[loadUserStories] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[loadUserStories] Error response:', errorText);
        
        // Se for erro 500 ou 522, não quebrar a aplicação
        if (response.status >= 500) {
          console.warn('[loadUserStories] ⚠️ Erro de servidor - continuando com array vazio');
          setStories([]);
          return;
        }
        
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('[loadUserStories] ✅ Stories carregadas:', data.stories?.length || 0);
      
      if (data.success && Array.isArray(data.stories)) {
        // Filtrar stories por courseId
        const courseStories = data.stories.filter((s: any) => s.courseId === courseId);
        console.log(`[loadUserStories] User stories do curso ${courseId}:`, courseStories.length);
        setStories(courseStories);
      } else {
        setStories([]);
      }
    } catch (error: any) {
      console.error('[loadUserStories] ❌ Erro:', error);
      
      if (isNetworkError(error)) {
        toast.error('🌐 Sem conexão com o servidor. Verifique sua internet.', { duration: 5000 });
      }
      
      setStories([]);
    } finally {
      setLoadingStories(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      
      const response = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/students`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        },
        { maxRetries: 2, delayMs: 800 }
      );

      if (!response.ok) {
        if (response.status >= 500) {
          console.warn('[loadStudents] ⚠️ Erro de servidor');
          setStudentsList([]);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.students)) {
        const courseStudents = data.students.filter((s: any) => s.courseId === courseId);
        
        // 🛡️ ANTI-DUPLICAÇÃO
        const uniqueStudents = new Map();
        courseStudents.forEach((student: any) => {
          const key = student.name.toLowerCase().trim();
          const existing = uniqueStudents.get(key);
          
          if (!existing) {
            uniqueStudents.set(key, student);
          } else {
            const existingDate = new Date(existing.createdAt || 0).getTime();
            const newDate = new Date(student.createdAt || 0).getTime();
            
            if (newDate > existingDate) {
              console.log(`[ANTI-DUP] Mantendo mais recente: "${student.name}"`);
              uniqueStudents.set(key, student);
            }
          }
        });
        
        const filteredStudents = Array.from(uniqueStudents.values());
        console.log('[loadStudents] ✅', filteredStudents.length, 'formandos carregados');
        setStudentsList(filteredStudents);
      } else {
        setStudentsList([]);
      }
    } catch (error: any) {
      console.error('[loadStudents] ❌ Erro:', error);
      if (isNetworkError(error)) {
        // Silencioso - não incomodar utilizador
      }
      setStudentsList([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      
      const teamsUrl = courseId 
        ? `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams?courseId=${courseId}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams`;
      
      const response = await fetchWithRetry(
        teamsUrl,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        },
        { maxRetries: 2, delayMs: 800 }
      );

      if (!response.ok) {
        if (response.status >= 500) {
          console.warn('[loadTeams] ⚠️ Erro de servidor');
          setTeams([]);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.teams)) {
        const filteredTeams = courseId 
          ? data.teams.filter((t: any) => t.courseId === courseId)
          : data.teams;
        
        console.log('[loadTeams] ✅', filteredTeams.length, 'equipas carregadas');
        setTeams(filteredTeams);
      } else {
        setTeams([]);
      }
    } catch (error: any) {
      console.error('[loadTeams] ❌ Erro:', error);
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadSprints = async () => {
    try {
      setLoadingSprints(true);
      
      const response = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/sprints`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        },
        { maxRetries: 2, delayMs: 800 }
      );

      if (!response.ok) {
        if (response.status >= 500) {
          console.warn('[loadSprints] ⚠️ Erro de servidor');
          setSprints([]);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.sprints)) {
        const courseSprints = data.sprints.filter((s: any) => s.courseId === courseId);
        console.log('[loadSprints] ✅', courseSprints.length, 'sprints carregados');
        setSprints(courseSprints);
      } else {
        setSprints([]);
      }
    } catch (error: any) {
      console.error('[loadSprints] ❌ Erro:', error);
      setSprints([]);
    } finally {
      setLoadingSprints(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories/${storyId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao apagar user story');
      }

      toast.success('User story apagada com sucesso');
      loadUserStories(); // Recarregar lista
    } catch (error) {
      console.error('Error deleting user story:', error);
      toast.error('Erro ao apagar user story');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    console.log('[CourseDetails] A apagar formando:', id);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/students/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao apagar formando');
      }

      console.log('[CourseDetails] Formando apagado com sucesso');
      
      // Atualizar a lista local
      setStudentsList(studentsList.filter(s => s.id !== id));
      toast.success('Formando removido com sucesso');
      
      // Recarregar dados
      loadStudents();
    } catch (error: any) {
      console.error('[CourseDetails] Erro ao apagar formando:', error);
      toast.error(error.message || 'Erro ao apagar formando');
    }
  };

  // Helper para obter o nome da equipa pelo teamId
  const getTeamName = (teamId: string | undefined) => {
    if (!teamId) return 'Sem Equipa';
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Sem Equipa';
  };

  // Helper para obter o número de membros de uma equipa
  const getTeamMemberCount = (teamId: string) => {
    return studentsList.filter(s => s.teamId === teamId).length;
  };

  // Helper para calcular a performance de uma equipa
  const getTeamPerformance = (teamId: string) => {
    // Buscar todas as stories atribuídas a esta equipa
    const teamStories = stories.filter(s => s.teamId === teamId);
    
    if (teamStories.length === 0) return { performance: 0, completedStories: 0, totalStories: 0 };
    
    // Contar stories concluídas
    const completedStories = teamStories.filter(s => s.status === 'done' || s.status === 'completed').length;
    const totalStories = teamStories.length;
    
    // Calcular percentagem de conclusão
    const performance = totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;
    
    return { performance, completedStories, totalStories };
  };

  // Helper para calcular o progresso geral do curso
  const getCourseProgress = () => {
    if (stories.length === 0) return 0;
    
    // Contar todas as stories concluídas do curso
    const completedStories = stories.filter(s => s.status === 'done' || s.status === 'completed').length;
    const totalStories = stories.length;
    
    // Calcular percentagem de conclusão
    const progress = totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;
    
    return progress;
  };

  // Mock data - Dados do curso
  const course = {
    name: courseName,
    students: 20,
    teams: 3,
    sprints: 4,
    userStories: stories.length || 45,
    progress: getCourseProgress(),
  };

  const handleAddStudent = async () => {
    if (!studentName || !studentEmail) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    try {
      console.log('[handleAddStudent] Enviando POST:', {
        name: studentName,
        email: studentEmail,
        courseId: courseId,
        teamId: ''
      });

      // Fazer POST request ao backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/students`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: studentName,
            email: studentEmail,
            courseId: courseId,
            teamId: '',
          }),
        }
      );

      console.log('[handleAddStudent] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[handleAddStudent] Erro do servidor:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('[handleAddStudent] Formando criado no backend:', data);
      console.log('[handleAddStudent] ID do formando criado:', data.student?.id);

      // NÃO adicionar à lista local manualmente - deixar o loadStudents fazer isso
      // para evitar duplicados e garantir que os IDs estão corretos
      
      setStudentName('');
      setStudentEmail('');
      setIsAddStudentOpen(false);
      
      // Recarregar lista de formandos do backend
      await loadStudents();
      
      toast.success('✅ Formando adicionado com sucesso!');
    } catch (error) {
      console.error('[handleAddStudent] Erro ao criar formando:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar formando');
    }
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent || !studentName || !studentEmail) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    try {
      console.log('🔄 Atualizando formando:');
      console.log('  → ID:', selectedStudent.id);
      console.log('  → Nome:', studentName);
      console.log('  → Email:', studentEmail);
      console.log('  → Equipa:', studentTeamId);
      console.log('  → Curso:', selectedStudent.courseId);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/students/${selectedStudent.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: studentName,
            email: studentEmail,
            courseId: selectedStudent.courseId,
            teamId: studentTeamId || '',
          }),
        }
      );

      if (!response.ok) {
        // 🔧 SOLUÇÃO: Se 404, criar o formando no backend automaticamente
        if (response.status === 404) {
          console.log('🔄 Sincronizando formando com o backend...');
          
          // Criar formando no backend com o mesmo ID
          const createResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/students`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: selectedStudent.id, // Usar o ID existente!
                name: studentName,
                email: studentEmail,
                courseId: selectedStudent.courseId,
                teamId: studentTeamId || '',
              }),
            }
          );
          
          if (!createResponse.ok) {
            console.log('⚠️ Não foi possível sincronizar');
            toast.error('Erro ao atualizar formando');
            return;
          }
          
          await createResponse.json();
          console.log('✅ Formando sincronizado');
          
          setIsEditStudentOpen(false);
          setSelectedStudent(null);
          setStudentName('');
          setStudentEmail('');
          setStudentTeamId('');
          
          await loadStudents();
          
          return;
        }
        
        // Outros erros
        console.log('⚠️ Erro ao atualizar');
        toast.error('Erro ao atualizar formando');
        return;
      }

      const data = await response.json();
      console.log('✅ Atualizado:', data.student);
      
      // Fechar modal
      setIsEditStudentOpen(false);
      setSelectedStudent(null);
      setStudentName('');
      setStudentEmail('');
      setStudentTeamId('');
      
      // Recarregar
      await loadStudents();
      
    } catch (error) {
      console.log('⚠️ Erro inesperado');
      toast.error('Erro ao atualizar formando');
    }
  };

  const openEditModal = (student: any) => {
    console.log('[openEditModal] ===== INÍCIO DEBUG =====');
    console.log('[openEditModal] Formando selecionado:', student);
    console.log('[openEditModal] ID do formando:', student.id);
    console.log('[openEditModal] Tipo do ID:', typeof student.id);
    console.log('[openEditModal] Todos os dados:', JSON.stringify(student, null, 2));
    console.log('[openEditModal] ===== FIM DEBUG =====');
    
    setSelectedStudent(student);
    setStudentName(student.name);
    setStudentEmail(student.email);
    setStudentTeamId(student.teamId || '');
    setIsEditStudentOpen(true);
  };

  const openMessageModal = (student: any) => {
    setSelectedStudent(student);
    setMessageText('');
    setIsMessageStudentOpen(true);
  };

  const handleSendMessage = () => {
    if (!messageText) return;
    toast.success(`Mensagem enviada para ${selectedStudent?.name}`);
    setIsMessageStudentOpen(false);
    setMessageText('');
    setSelectedStudent(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-700';
      case 'active':
      case 'inProgress':
        return 'bg-yellow-100 text-yellow-700';
      case 'planned':
      case 'todo':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Concluído',
      active: 'Ativo',
      planned: 'Planeado',
      done: 'Concluído',
      inProgress: 'Em Progresso',
      todo: 'A Fazer',
    };
    return labels[status] || status;
  };

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 pt-[110px] dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <Header title={course.name} onBack={onBack} showProfile={false} />

      {/* Backend Warning */}
      <BackendWarning 
        show={showBackendWarning} 
        onDismiss={() => setShowBackendWarning(false)} 
      />

      {/* Tabs */}
      <div className="w-full max-w-md mx-auto px-6 pt-2">
        <div className="bg-white rounded-[16px] p-2 shadow-sm space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full py-3 px-4 rounded-[12px] text-[14px] transition-all flex items-center justify-between ${
              activeTab === 'overview'
                ? 'bg-[#4aa540] text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 size={18} />
              <span>Resumo</span>
            </div>
            {activeTab === 'overview' && <ChevronRight size={18} />}
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`w-full py-3 px-4 rounded-[12px] text-[14px] transition-all flex items-center justify-between ${
              activeTab === 'teams'
                ? 'bg-[#4aa540] text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users size={18} />
              <span>Equipas</span>
            </div>
            {activeTab === 'teams' && <ChevronRight size={18} />}
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`w-full py-3 px-4 rounded-[12px] text-[14px] transition-all flex items-center justify-between ${
              activeTab === 'students'
                ? 'bg-[#4aa540] text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users size={18} />
              <span>Formandos</span>
            </div>
            {activeTab === 'students' && <ChevronRight size={18} />}
          </button>
          <button
            onClick={() => setActiveTab('sprints')}
            className={`w-full py-3 px-4 rounded-[12px] text-[14px] transition-all flex items-center justify-between ${
              activeTab === 'sprints'
                ? 'bg-[#4aa540] text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers size={18} />
              <span>Sprints</span>
            </div>
            {activeTab === 'sprints' && <ChevronRight size={18} />}
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`w-full py-3 px-4 rounded-[12px] text-[14px] transition-all flex items-center justify-between ${
              activeTab === 'stories'
                ? 'bg-[#4aa540] text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText size={18} />
              <span>Stories</span>
            </div>
            {activeTab === 'stories' && <ChevronRight size={18} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-md mx-auto px-6 py-6 space-y-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-[16px] p-5 shadow-sm">
            <h3 className="text-[18px] text-slate-800 mb-4">Progresso Geral</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => setActiveTab('teams')}
                className="bg-slate-50 rounded-[12px] p-4 text-center hover:bg-slate-100 transition-colors"
              >
                <Target className="text-purple-600 mx-auto mb-2" size={28} />
                <p className="text-[24px] text-slate-800">{teams.length}</p>
                <p className="text-[13px] text-slate-600">Equipas</p>
              </button>
              <button 
                onClick={() => setActiveTab('students')}
                className="bg-slate-50 rounded-[12px] p-4 text-center hover:bg-slate-100 transition-colors"
              >
                <Users className="text-[#4aa540] mx-auto mb-2" size={28} />
                <p className="text-[24px] text-slate-800">{studentsList.length}</p>
                <p className="text-[13px] text-slate-600">Formandos</p>
              </button>
              <button 
                onClick={() => setActiveTab('sprints')}
                className="bg-slate-50 rounded-[12px] p-4 text-center hover:bg-slate-100 transition-colors"
              >
                <Layers className="text-orange-600 mx-auto mb-2" size={28} />
                <p className="text-[24px] text-slate-800">{sprints.length}</p>
                <p className="text-[13px] text-slate-600">Sprints</p>
              </button>
              <button 
                onClick={() => setActiveTab('stories')}
                className="bg-slate-50 rounded-[12px] p-4 text-center hover:bg-slate-100 transition-colors"
              >
                <FileText className="text-blue-600 mx-auto mb-2" size={28} />
                <p className="text-[24px] text-slate-800">{stories.length}</p>
                <p className="text-[13px] text-slate-600">Stories</p>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] text-slate-700">Conclusão do Curso</span>
                <span className="text-[18px] text-[#4aa540] font-medium">{course.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4">
                <div 
                  className="bg-[#4aa540] h-4 rounded-full transition-all" 
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] text-slate-800">Formandos ({studentsList.length})</h3>
              <button
                onClick={() => onNavigate?.('createStudent', { courseId, courseName })}
                className="bg-[#4aa540] text-white px-3 py-2 rounded-[10px] text-[13px] flex items-center gap-1 hover:bg-[#3d8935] transition-colors"
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar formandos..."
                className="w-full bg-white border border-slate-200 rounded-[12px] pl-10 pr-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540]"
              />
            </div>

            {loadingStudents ? (
              <div className="text-center py-8 text-slate-500">
                A carregar formandos...
              </div>
            ) : studentsList.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto text-slate-300 mb-2" size={40} />
                <p className="text-slate-500 text-[14px]">Nenhum formando neste curso</p>
                <p className="text-slate-400 text-[12px]">Clique em "Adicionar" para criar o primeiro</p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentsList.map((student) => (
                  <div
                    key={student.id}
                    className="bg-white rounded-[16px] p-4 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-slate-100">
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback className="bg-slate-100 text-slate-500">
                          {student.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-[14px] font-medium text-slate-800">{student.name}</h4>
                        <div className="flex items-center gap-2">
                           <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                             !student.teamId 
                               ? 'bg-slate-100 text-slate-500' 
                               : 'bg-green-50 text-[#4aa540]'
                           }`}>
                             {getTeamName(student.teamId)}
                           </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-2 text-slate-400 hover:text-[#4aa540] hover:bg-slate-50 rounded-full transition-colors"
                        onClick={() => openMessageModal(student)}
                      >
                        <Mail size={18} />
                      </button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors focus:outline-none">
                            <MoreVertical size={18} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px] bg-white rounded-xl shadow-lg border-slate-100 p-1">
                          <DropdownMenuItem onClick={() => openEditModal(student)} className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer rounded-lg hover:bg-slate-50 p-2 outline-none">
                            <Pencil size={14} />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteStudent(student.id)} className="flex items-center gap-2 text-[13px] text-red-600 cursor-pointer rounded-lg hover:bg-red-50 p-2 outline-none">
                            <Trash2 size={14} />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] text-slate-800">Equipas ({teams.length})</h3>
              <button
                onClick={() => onNavigate?.('createTeam', { courseId, courseName })}
                className="bg-[#4aa540] text-white px-3 py-2 rounded-[10px] text-[13px] flex items-center gap-1 hover:bg-[#3d8935] transition-colors"
              >
                <Plus size={16} />
                Nova Equipa
              </button>
            </div>

            {loadingTeams ? (
              <div className="text-center py-8 text-slate-500">
                A carregar equipas...
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto text-slate-300 mb-2" size={40} />
                <p className="text-slate-500 text-[14px]">Nenhuma equipa neste curso</p>
                <p className="text-slate-400 text-[12px]">Clique em "Nova Equipa" para criar a primeira</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map((team) => {
                  const { performance, completedStories, totalStories } = getTeamPerformance(team.id);
                  
                  return (
                  <div
                    key={team.id}
                    className="bg-white rounded-[16px] p-4 shadow-sm hover:shadow-md transition-all w-full border-2 border-transparent hover:border-[#4aa540]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => onNavigate?.('turmaDetails', { teamId: team.id })}
                        className="flex-1 text-left"
                      >
                        <h4 className="text-[15px] text-slate-800 mb-1">{team.name}</h4>
                        <p className="text-[12px] text-slate-500">{getTeamMemberCount(team.id)} membros</p>
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigate?.('turmaDetails', { teamId: team.id })}
                          className="p-2 text-slate-400 hover:text-[#4aa540] hover:bg-slate-50 rounded-full transition-colors"
                        >
                          <ChevronRight size={20} />
                        </button>
                        
                        <button
                          onClick={async () => {
                            if (confirm(`Tem certeza que deseja apagar a equipa "${team.name}"?`)) {
                              try {
                                const response = await fetch(
                                  `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams/${team.id}`,
                                  {
                                    method: 'DELETE',
                                    headers: {
                                      'Authorization': `Bearer ${publicAnonKey}`,
                                      'Content-Type': 'application/json',
                                    },
                                  }
                                );

                                if (!response.ok) {
                                  throw new Error('Erro ao apagar equipa');
                                }

                                toast.success(`Equipa "${team.name}" apagada com sucesso!`);
                                loadTeams(); // Recarregar lista
                              } catch (error) {
                                console.error('Erro ao apagar equipa:', error);
                                toast.error('Erro ao apagar equipa');
                              }
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate?.('turmaDetails', { teamId: team.id })}
                      className="w-full text-left"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] text-slate-500 mb-1">Performance</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-[#4aa540] h-2 rounded-full transition-all" 
                                style={{ width: `${performance}%` }}
                              />
                            </div>
                            <span className="text-[12px] text-slate-700">{performance}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 mb-1">Stories Concluídas</p>
                          <p className="text-[16px] text-slate-800">{completedStories}/{totalStories}</p>
                        </div>
                      </div>
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Sprints Tab */}
        {activeTab === 'sprints' && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] text-slate-800">Sprints ({sprints.length})</h3>
              <button
                onClick={() => onNavigate?.('createSprint')}
                className="bg-[#4aa540] text-white px-3 py-2 rounded-[10px] text-[13px] flex items-center gap-1 hover:bg-[#3d8935] transition-colors"
              >
                <Plus size={16} />
                Novo Sprint
              </button>
            </div>

            {loadingSprints ? (
              <div className="text-center py-8 text-slate-500">
                A carregar sprints...
              </div>
            ) : sprints.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="mx-auto text-slate-300 mb-2" size={40} />
                <p className="text-slate-500 text-[14px]">Nenhum sprint criado</p>
                <p className="text-slate-400 text-[12px]">Clique em "Novo Sprint" para criar o primeiro</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sprints.map((sprint) => (
                  <div
                    key={sprint.id}
                    className="bg-white rounded-[16px] p-4 shadow-sm hover:shadow-md transition-all w-full border-2 border-transparent hover:border-[#4aa540]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => {
                          console.log('[CourseDetails] 🎯 FORMADOR clicou em sprint:', sprint.id, sprint.name);
                          onNavigate?.('sprintBoard', { 
                            sprintId: sprint.id,
                            sprintName: sprint.name,
                            teamId: sprint.teamId
                          });
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[15px] text-slate-800">{sprint.name}</h4>
                          <span className={`${getStatusColor(sprint.status)} px-2 py-1 rounded-[6px] text-[10px]`}>
                            {getStatusLabel(sprint.status)}
                          </span>
                        </div>
                      </button>
                      
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Tem certeza que deseja apagar o sprint "${sprint.name}"?`)) {
                            try {
                              const response = await fetch(
                                `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/sprints/${sprint.id}`,
                                {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${publicAnonKey}`,
                                    'Content-Type': 'application/json',
                                  },
                                }
                              );

                              if (!response.ok) {
                                throw new Error('Erro ao apagar sprint');
                              }

                              toast.success(`Sprint "${sprint.name}" apagado com sucesso!`);
                              loadSprints(); // Recarregar lista
                            } catch (error) {
                              console.error('Erro ao apagar sprint:', error);
                              toast.error('Erro ao apagar sprint');
                            }
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        console.log('[CourseDetails] 🎯 FORMADOR clicou em sprint:', sprint.id, sprint.name);
                        onNavigate?.('sprintBoard', { 
                          sprintId: sprint.id,
                          sprintName: sprint.name,
                          teamId: sprint.teamId
                        });
                      }}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[12px] text-slate-500">{sprint.stories} user stories</p>
                        {(() => {
                          // Calcular total de pontos das stories deste sprint
                          const sprintStories = stories.filter(s => s.sprintId === sprint.id);
                          const totalPoints = sprintStories.reduce((sum, s) => sum + (Number(s.points) || 0), 0);
                          
                          return totalPoints > 0 ? (
                            <span 
                              className="text-white px-2.5 py-1 rounded-[6px] text-[11px] font-medium"
                              style={{ backgroundColor: isFormador ? '#4aa540' : '#0b87ac' }}
                            >
                              {totalPoints} pts total
                            </span>
                          ) : null;
                        })()}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-slate-500">Progresso</span>
                          <span className="text-[11px] text-slate-700">{(() => {
                            // Calcular progresso real baseado nas stories concluídas
                            const sprintStories = stories.filter(s => s.sprintId === sprint.id);
                            const totalStories = sprintStories.length;
                            const completedStories = sprintStories.filter(s => s.status === 'done').length;
                            
                            // Só mostra 100% se TODAS as stories estiverem concluídas
                            return totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;
                          })()}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-[#4aa540] h-2 rounded-full" 
                            style={{ width: `${(() => {
                              // Calcular progresso real baseado nas stories concluídas
                              const sprintStories = stories.filter(s => s.sprintId === sprint.id);
                              const totalStories = sprintStories.length;
                              const completedStories = sprintStories.filter(s => s.status === 'done').length;
                              
                              // Só mostra 100% se TODAS as stories estiverem concluídas
                              return totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;
                            })()}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Stories Tab */}
        {activeTab === 'stories' && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] text-slate-800">User Stories ({stories.length})</h3>
              <button
                onClick={() => onNavigate?.('createUserStory')}
                className="bg-[#4aa540] text-white px-3 py-2 rounded-[10px] text-[13px] flex items-center gap-1 hover:bg-[#3d8935] transition-colors"
              >
                <Plus size={16} />
                Nova Story
              </button>
            </div>

            {loadingStories ? (
              <div className="text-center py-8 text-slate-500">
                A carregar user stories...
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto text-slate-300 mb-2" size={40} />
                <p className="text-slate-500 text-[14px]">Nenhuma user story criada</p>
                <p className="text-slate-400 text-[12px]">Clique em "Nova Story" para criar a primeira</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stories.map((story) => {
                  // DEBUG: Log detalhado de cada story
                  console.log('[CourseDetails] 🔍 STORY COMPLETA:', {
                    id: story.id,
                    title: story.title,
                    points: story.points,
                    pointsType: typeof story.points,
                    pointsRaw: JSON.stringify(story.points),
                    pointsNumber: Number(story.points),
                    pointsCondition: story.points && Number(story.points) > 0,
                    fullStory: story
                  });
                  
                  return (
                  <div
                    key={story.id}
                    className="bg-white rounded-[12px] p-4 shadow-sm border-2 border-transparent hover:border-[#4aa540] transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 pr-2">
                        <button
                          onClick={() => {
                            setSelectedUserStory(story);
                            setPreviousScreen('courseDetails');
                            onNavigate?.('userStoryDetails');
                          }}
                          className="w-full text-left"
                        >
                          <h4 className="text-[15px] text-slate-800 font-medium mb-1">{story.title}</h4>
                          <p className="text-[12px] text-slate-500 line-clamp-2">{story.description}</p>
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteStory(story.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        aria-label="Apagar user story"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Tags and metadata */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {(() => {
                        // Calcular média dos votos
                        const hasPoints = story.points && Number(story.points) > 0;
                        const averageVote = story.votes && story.votes.length > 0
                          ? Math.round(story.votes.reduce((acc: number, vote: any) => acc + vote.value, 0) / story.votes.length)
                          : null;
                        
                        if (hasPoints) {
                          return (
                            <span 
                              className="text-white px-2.5 py-1 rounded-[6px] text-[11px] font-medium"
                              style={{ 
                                backgroundColor: isFormador ? '#4aa540' : '#0b87ac'
                              }}
                            >
                              {story.points} pts
                            </span>
                          );
                        } else if (averageVote !== null) {
                          return (
                            <span 
                              className="text-white px-2.5 py-1 rounded-[6px] text-[11px] font-medium"
                              style={{ backgroundColor: isFormador ? '#4aa540' : '#60a5fa' }}
                              title={`Média de ${story.votes?.length} voto(s)`}
                            >
                              {averageVote} pts
                            </span>
                          );
                        } else {
                          return (
                            <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-[6px] text-[11px]">
                              Sem votos
                            </span>
                          );
                        }
                      })()}
                      <span className={`${getStatusColor(story.status || 'backlog')} px-2 py-1 rounded-[6px] text-[11px]`}>
                        {getStatusLabel(story.status || 'backlog')}
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-[6px] text-[11px]">
                        {story.team || 'Sem equipa'}
                      </span>
                      <span className={`px-2 py-1 rounded-[6px] text-[11px] ${
                        story.priority === 'high' ? 'bg-red-100 text-red-700' :
                        story.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {story.priority === 'high' ? 'Alta' : story.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>

                    {/* Acceptance Criteria */}
                    {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2">Critérios de Aceitação</p>
                        <ul className="space-y-1">
                          {story.acceptanceCriteria.map((criterion: string, index: number) => (
                            <li key={index} className="text-[12px] text-slate-600 flex items-start gap-2">
                              <CheckCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{criterion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="pb-8" />
      </div>

      {/* Add Student Dialog */}
      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle>Adicionar Formando</DialogTitle>
            <DialogDescription>
              Adicione um novo formando a este curso.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStudentOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddStudent} className="bg-[#4aa540] hover:bg-[#3d8935]">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditStudentOpen} onOpenChange={setIsEditStudentOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle>Editar Formando</DialogTitle>
            <DialogDescription>
              Atualize as informações do formando.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-team" className="flex items-center gap-2">
                <Users size={16} />
                Equipa
              </Label>
              {loadingTeams ? (
                <div className="text-[14px] text-slate-400 py-2 px-3">
                  A carregar equipas...
                </div>
              ) : (
                <select
                  id="edit-team"
                  value={studentTeamId}
                  onChange={(e) => setStudentTeamId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4aa540] focus-visible:ring-offset-2"
                >
                  <option value="">Sem equipa atribuída</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[11px] text-slate-500">
                Selecione a equipa à qual o formando pertence
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditStudentOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateStudent} className="bg-[#4aa540] hover:bg-[#3d8935]">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={isMessageStudentOpen} onOpenChange={setIsMessageStudentOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem</DialogTitle>
            <DialogDescription>
              Enviar mensagem para {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Escreva a sua mensagem..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageStudentOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendMessage} className="bg-[#4aa540] hover:bg-[#3d8935] flex items-center gap-2">
              <MessageSquare size={16} />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
