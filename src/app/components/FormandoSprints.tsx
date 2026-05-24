import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Calendar,
  Target,
  CheckCircle,
  Clock,
  PlayCircle,
  ListTodo,
  Award,
  TrendingUp
} from 'lucide-react';
import { Header } from './shared/Header';
import { useApp } from '../context/AppContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
  courseId: string;
  teamId?: string;
  createdAt: string;
}

interface FormandoSprintsProps {
  onBack: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export function FormandoSprints({ onBack, onNavigate }: FormandoSprintsProps) {
  const { loggedStudent, setSelectedUserStory } = useApp();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // LOG DETALHADO DO FORMANDO
  console.log('[FormandoSprints] 🔍 DADOS DO FORMANDO:', {
    loggedStudent,
    teamId: loggedStudent?.teamId,
    teamName: loggedStudent?.teamName,
    courseId: loggedStudent?.courseId,
    courseName: loggedStudent?.courseName
  });

  useEffect(() => {
    loadSprints();
    loadStories();
  }, [loggedStudent?.teamId]);

  const loadStories = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.stories)) {
          setStories(data.stories);
        }
      }
    } catch (error) {
      console.error('[FormandoSprints] ❌ Erro ao carregar stories:', error);
    }
  };

  const loadSprints = async () => {
    if (!loggedStudent?.teamId) {
      console.log('[FormandoSprints] ⚠️ Formando sem equipa');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[FormandoSprints] 📥 A carregar sprints da equipa:', loggedStudent.teamId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/sprints`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('[FormandoSprints] 📦 Resposta da API completa:', data);
        
        if (data.success && Array.isArray(data.sprints)) {
          console.log('[FormandoSprints] 📊 TODOS OS SPRINTS antes do filtro:', data.sprints);
          console.log('[FormandoSprints] 🔍 Procurando teamId:', loggedStudent.teamId);
          
          // LOG DETALHADO de cada sprint
          data.sprints.forEach((sprint: any, index: number) => {
            console.log(`[FormandoSprints] Sprint ${index + 1}:`, {
              id: sprint.id,
              name: sprint.name,
              teamId: sprint.teamId,
              courseId: sprint.courseId,
              status: sprint.status,
              matchTeam: sprint.teamId === loggedStudent.teamId ? '✅ MATCH TEAM!' : '❌ não match team',
              matchCourse: sprint.courseId === loggedStudent.courseId ? '✅ MATCH COURSE!' : '❌ não match course'
            });
          });
          
          // Filtrar sprints:
          // 1. Do curso do formando (courseId === loggedStudent.courseId)
          // 2. E da equipa do formando (teamId === loggedStudent.teamId) OU sprints sem equipa específica
          const teamSprints = data.sprints.filter((sprint: Sprint) => {
            // Primeiro verificar se é do curso correto
            if (sprint.courseId !== loggedStudent.courseId) {
              console.log(`[FormandoSprints] ❌ Sprint "${sprint.name}" - DE OUTRO CURSO`);
              return false;
            }
            
            // Sprint específico da equipa do formando
            if (sprint.teamId === loggedStudent.teamId) {
              console.log(`[FormandoSprints] ✅ Sprint "${sprint.name}" - DA EQUIPA`);
              return true;
            }
            
            // Sprint para todas as equipas (sem teamId ou teamId vazio)
            if (!sprint.teamId || sprint.teamId === '') {
              console.log(`[FormandoSprints] ✅ Sprint "${sprint.name}" - TODAS AS EQUIPAS`);
              return true;
            }
            
            console.log(`[FormandoSprints] ❌ Sprint "${sprint.name}" - DE OUTRA EQUIPA`);
            return false;
          });
          
          console.log('[FormandoSprints] ✅ Sprints após filtro:', teamSprints.length, 'sprints');
          console.log('[FormandoSprints] 📋 Sprints filtrados:', teamSprints);
          setSprints(teamSprints);
        } else {
          console.log('[FormandoSprints] ⚠️ Resposta sem sprints ou formato incorreto');
          setSprints([]);
        }
      } else {
        console.error('[FormandoSprints] ❌ Erro ao carregar sprints:', response.status);
        toast.error('Erro ao carregar sprints');
      }
    } catch (error) {
      console.error('[FormandoSprints] ❌ Erro:', error);
      toast.error('Erro ao carregar sprints');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-700 dark:text-blue-300',
          icon: PlayCircle,
          label: 'Em Progresso'
        };
      case 'completed':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-700 dark:text-green-300',
          icon: CheckCircle,
          label: 'Concluído'
        };
      case 'upcoming':
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-700',
          text: 'text-slate-700 dark:text-slate-300',
          icon: Clock,
          label: 'Planeado'
        };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sem data';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSprintClick = (sprint: any) => {
    console.log('[FormandoSprints] 🎯 Navegando para SprintBoard:', sprint.id);
    onNavigate?.('sprintBoard', { 
      sprintId: sprint.id,
      sprintName: sprint.name,
      teamId: sprint.teamId
    });
  };

  // Calcular métricas para cada sprint
  const getSprintMetrics = (sprintId: string) => {
    // Filtrar stories deste sprint
    const sprintStories = stories.filter(s => s.sprintId === sprintId);
    
    const userStoryCount = sprintStories.length;
    
    // Calcular total de story points (priorizar pontos finais, senão usar média de votos)
    const totalStoryPoints = sprintStories.reduce((sum, story) => {
      // Se tiver pontos finais definidos
      if (story.points && Number(story.points) > 0) {
        return sum + Number(story.points);
      }
      // Senão, calcular média dos votos
      if (story.votes && story.votes.length > 0) {
        const averageVote = Math.round(
          story.votes.reduce((acc: number, vote: any) => acc + vote.value, 0) / story.votes.length
        );
        return sum + averageVote;
      }
      return sum;
    }, 0);
    
    // Calcular taxa de conclusão
    const completedStories = sprintStories.filter(s => s.status === 'done').length;
    const completionRate = userStoryCount > 0 
      ? Math.round((completedStories / userStoryCount) * 100) 
      : 0;
    
    return { userStoryCount, totalStoryPoints, completionRate };
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 dark:bg-slate-900 transition-colors duration-200">
      <Header
        title="Meus Sprints"
        onBack={onBack}
        variant="formando"
        showProfile={false}
      />

      <div className="w-full max-w-md mx-auto px-6 pt-30 space-y-4">
        {/* Verificar se o formando tem equipa */}
        {!loggedStudent?.teamId ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-[16px] shadow-sm">
            <Target className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
            <p className="text-slate-500 dark:text-slate-400 text-[14px]">Ainda não estás numa equipa</p>
            <p className="text-slate-400 dark:text-slate-500 text-[12px] mt-1">
              O formador irá atribuir-te a uma equipa em breve
            </p>
          </div>
        ) : (
          <>
            {/* Info Card da Equipa */}
            <div className="bg-gradient-to-br from-[#0b87ac] to-[#096d8a] rounded-[16px] p-5 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-[12px] mb-1">Minha Equipa</p>
                  <h2 className="text-[20px]">{loggedStudent?.teamName || 'Sem Equipa'}</h2>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-[18px] border-2 border-white/30">
                  {loggedStudent?.teamName?.charAt(0).toUpperCase() || 'F'}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-white/70 text-[11px] mb-1">Total Sprints</p>
                  <p className="text-[20px]">{sprints.length}</p>
                </div>
                <div>
                  <p className="text-white/70 text-[11px] mb-1">Em Progresso</p>
                  <p className="text-[20px]">{sprints.filter(s => s.status === 'active').length}</p>
                </div>
                <div>
                  <p className="text-white/70 text-[11px] mb-1">Concluídos</p>
                  <p className="text-[20px]">{sprints.filter(s => s.status === 'completed').length}</p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="w-full max-w-md mx-auto px-6 mb-6">
              <div className="grid grid-cols-3 gap-3">
                {/* Total Sprints */}
                <div className="bg-white dark:bg-slate-800 rounded-[16px] p-4 text-center shadow-sm">
                  <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">Total</p>
                  <p className="text-[20px]">{sprints.length}</p>
                </div>
              </div>
            </div>

            {/* Lista de Sprints */}
            {loading ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                A carregar sprints...
              </div>
            ) : sprints.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-[16px] shadow-sm">
                <Target className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
                <p className="text-slate-500 dark:text-slate-400 text-[14px]">Ainda não há sprints</p>
                <p className="text-slate-400 dark:text-slate-500 text-[12px] mt-1">
                  O formador irá criar sprints para a tua equipa
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sprints.map((sprint) => {
                  const statusInfo = getStatusBadge(sprint.status);
                  const StatusIcon = statusInfo.icon;

                  // Calcular métricas para este sprint
                  const { userStoryCount, totalStoryPoints, completionRate } = getSprintMetrics(sprint.id);

                  return (
                    <button
                      key={sprint.id}
                      onClick={() => handleSprintClick(sprint)}
                      className="w-full bg-white dark:bg-slate-800 rounded-[16px] p-5 shadow-sm hover:shadow-md transition-all text-left"
                    >
                      {/* Header do Sprint */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-[16px] text-slate-800 dark:text-slate-200 mb-1">
                            {sprint.name}
                          </h3>
                          {sprint.goal && (
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2">
                              {sprint.goal}
                            </p>
                          )}
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] ${statusInfo.bg} ${statusInfo.text}`}>
                          <StatusIcon size={14} />
                          <span className="text-[11px] font-medium">{statusInfo.label}</span>
                        </div>
                      </div>

                      {/* Datas */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400">
                          <Calendar size={14} />
                          <span>{formatDate(sprint.startDate)}</span>
                        </div>
                        <span className="text-slate-300 dark:text-slate-600">→</span>
                        <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400">
                          <Calendar size={14} />
                          <span>{formatDate(sprint.endDate)}</span>
                        </div>
                      </div>

                      {/* Métricas */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">User Stories</p>
                          <p className="text-[16px] text-slate-800 dark:text-slate-200 font-medium">
                            {userStoryCount || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">Story Points</p>
                          <p className="text-[16px] text-[#0b87ac] font-medium">
                            {totalStoryPoints || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">Conclusão</p>
                          <p className="text-[16px] text-green-600 dark:text-green-400 font-medium">
                            {completionRate || 0}%
                          </p>
                        </div>
                      </div>

                      {/* Indicador de ação */}
                      <div className="flex items-center justify-end gap-2 mt-3 text-[#0b87ac] text-[12px] font-medium">
                        <ListTodo size={14} />
                        <span>Ver Quadro Kanban</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}