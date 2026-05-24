import { useState, useEffect } from 'react';
import { 
  Plus,
  Calendar,
  Target,
  Trash2,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from './shared/Header';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useApp } from '../context/AppContext';

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

interface SprintListProps {
  onBack: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

export function SprintList({ onBack, onNavigate }: SprintListProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { loggedStudent, userType, setSelectedUserStory } = useApp();

  const fetchSprints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/sprints`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar sprints');
      }

      // Filtrar sprints pelo curso do formando logado
      let filteredSprints = data.sprints || [];
      
      if (userType === 'formando' && loggedStudent?.courseId) {
        filteredSprints = filteredSprints.filter((sprint: Sprint) => 
          sprint.courseId === loggedStudent.courseId
        );
        console.log('Sprints filtrados para o curso do formando:', loggedStudent.courseId, filteredSprints);
      }

      setSprints(filteredSprints);
    } catch (err) {
      console.error('Error fetching sprints:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar sprints');
      toast.error('Erro ao carregar sprints');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Limpar selectedUserStory ao entrar no SprintList
    setSelectedUserStory(null);
    
    fetchSprints();
    
    // Polling automático a cada 30 segundos (melhor para UX)
    const intervalId = setInterval(() => {
      console.log('[SprintList] 🔄 Auto-reload - A recarregar sprints...');
      fetchSprints();
    }, 30000); // 30 segundos

    // Cleanup ao desmontar o componente
    return () => {
      console.log('[SprintList] 🛑 Limpando polling automático');
      clearInterval(intervalId);
    };
  }, [loggedStudent, userType]);

  const handleDelete = async (e: React.MouseEvent, sprintId: string, sprintName: string) => {
    e.stopPropagation(); // Previne a propagação do clique para o card
    
    if (!confirm(`Tem certeza que deseja eliminar o sprint \"${sprintName}\"?`)) {
      return;
    }

    setDeletingId(sprintId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/sprints/${sprintId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao eliminar sprint');
      }

      toast.success('Sprint eliminado com sucesso');
      // Refresh the list
      fetchSprints();
    } catch (err) {
      console.error('Error deleting sprint:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao eliminar sprint');
    } finally {
      setDeletingId(null);
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSprintStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { label: 'Agendado', color: 'text-blue-600 bg-blue-100' };
    } else if (now > end) {
      return { label: 'Concluído', color: 'text-slate-600 bg-slate-100' };
    } else {
      // Para formandos, usar azul em vez de verde
      return { 
        label: 'Em Progresso', 
        color: userType === 'formando' ? 'text-blue-600 bg-blue-100' : 'text-green-600 bg-green-100' 
      };
    }
  };

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 pt-[100px] dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <Header
        title="Sprints"
        onBack={onBack}
        showProfile={false}
        onPlay={userType === 'formador' ? () => onNavigate('createSprint') : undefined}
      />

      {/* Main Content */}
      <div className="max-w-[390px] mx-auto px-6 pt-6 pb-6 space-y-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="text-[#4aa540] animate-spin mb-4" size={40} />
            <p className="text-slate-600 text-[14px] dark:text-slate-400">Carregando sprints...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-[16px] p-6 shadow-sm border-2 border-red-200 dark:bg-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="text-red-600" size={24} />
              <h3 className="text-red-600 dark:text-red-400">Erro</h3>
            </div>
            <p className="text-slate-600 text-[14px] mb-4 dark:text-slate-400">{error}</p>
            <button
              onClick={fetchSprints}
              className="w-full bg-[#4aa540] text-white py-3 rounded-[12px] text-[14px] hover:bg-[#3d8935] transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : sprints.length === 0 ? (
          <div className="bg-white rounded-[16px] p-8 shadow-sm text-center dark:bg-slate-800 transition-colors">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-slate-700">
              <Calendar className="text-slate-400" size={32} />
            </div>
            <h3 className="text-[18px] text-slate-800 mb-2 dark:text-slate-200">Nenhum Sprint Criado</h3>
            <p className="text-[14px] text-slate-500 mb-6 dark:text-slate-400">
              Ainda não existem Sprints criados.
            </p>
            <button
              onClick={() => onNavigate('CreateSprint')}
              className="w-full bg-[#4aa540] text-white py-4 rounded-[14px] text-[16px] hover:bg-[#3d8935] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {/* <Plus size={20} />*/ } 
              Voltar ao menu anterior
            </button>
          </div>
        ) : (
          <>
            {/* Sprint Count */}
            <div 
              className="rounded-[16px] p-5 shadow-sm text-white"
              style={{
                background: userType === 'formando' 
                  ? 'linear-gradient(135deg, #0b87ac 0%, #096d8a 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              }}
            >
              <p className="text-white/80 text-[12px] mb-1">Total de Sprints</p>
              <h2 className="text-[32px] font-semibold">{sprints.length}</h2>
              <p className="text-white/90 text-[13px] mt-2">
                {sprints.filter(s => {
                  const now = new Date();
                  const start = new Date(s.startDate);
                  const end = new Date(s.endDate);
                  return now >= start && now <= end;
                }).length} em progresso
              </p>
            </div>

            {/* Sprints List */}
            <div className="space-y-3">
              {sprints.map((sprint) => {
                const status = getSprintStatus(sprint.startDate, sprint.endDate);
                const duration = calculateDuration(sprint.startDate, sprint.endDate);
                const hoverBorderColor = userType === 'formando' ? 'hover:border-[#0b87ac]' : 'hover:border-[#4aa540]';
                
                return (
                  <div 
                    key={sprint.id}
                    onClick={() => onNavigate('sprintBoard', { sprintId: sprint.id })}
                    className={`bg-white rounded-[16px] p-5 shadow-sm hover:shadow-md transition-all dark:bg-slate-800 cursor-pointer hover:border-2 ${hoverBorderColor} active:scale-[0.98]`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-[16px] text-slate-800 font-medium dark:text-slate-200">
                            {sprint.name}
                          </h3>
                          <span className={`text-[11px] px-2 py-1 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-600 mb-3 line-clamp-2 dark:text-slate-400">
                          {sprint.goal}
                        </p>
                      </div>
                      {userType === 'formador' && (
                        <button
                          onClick={(e) => handleDelete(e, sprint.id, sprint.name)}
                          disabled={deletingId === sprint.id}
                          className="ml-3 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 dark:hover:bg-red-900/20 z-10"
                          aria-label={`Eliminar sprint ${sprint.name}`}
                        >
                          {deletingId === sprint.id ? (
                            <Loader2 className="text-red-600 animate-spin" size={18} />
                          ) : (
                            <Trash2 className="text-red-600" size={18} />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                        <Target size={14} />
                        <span>{sprint.courseName || 'Sem curso'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                        <Calendar size={14} />
                        <span>
                          {new Date(sprint.startDate).toLocaleDateString('pt-PT', { 
                            day: '2-digit', 
                            month: 'short',
                            year: 'numeric'
                          })}
                          {' - '}
                          {new Date(sprint.endDate).toLocaleDateString('pt-PT', { 
                            day: '2-digit', 
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                        <Clock size={14} />
                        <span>{duration} dias</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create Sprint Button - apenas para formadores */}
            {userType === 'formador' && (
              <button
                onClick={() => onNavigate('createSprint')}
                className="w-full bg-[#4aa540] text-white py-4 rounded-[14px] text-[16px] hover:bg-[#3d8935] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Criar Novo Sprint
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}