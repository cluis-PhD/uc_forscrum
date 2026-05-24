import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Vote,
  X,
  Plus
} from 'lucide-react';
import { toast } from "sonner";
import { useApp } from '../context/AppContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface UserStoryDetailsProps {
  userType: 'formador' | 'formando';
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export function UserStoryDetails({ userType, onBack, onNavigate }: UserStoryDetailsProps) {
  const isFormador = userType === 'formador';
  const primaryColor = isFormador ? '#4aa540' : '#0b87ac';
  const { selectedUserStory } = useApp();

  const [story, setStory] = useState<any>(null); // ✅ Começa com null em vez de selectedUserStory
  const [loading, setLoading] = useState(true); // ✅ Começa com true
  const [status, setStatus] = useState<'backlog' | 'todo' | 'inProgress' | 'done'>(
    selectedUserStory?.status || 'backlog'
  );
  const [votes, setVotes] = useState<any[]>([]);
  const [loadingVotes, setLoadingVotes] = useState(false);

  // Estados para edição
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editCriteria, setEditCriteria] = useState<string[]>([]);
  const [newCriterion, setNewCriterion] = useState('');
  const [saving, setSaving] = useState(false);
  const [editTeam, setEditTeam] = useState('');
  
  // Equipas disponíveis
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Recarregar story completa do backend quando o componente monta
  useEffect(() => {
    const loadStory = async () => {
      if (!selectedUserStory?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories/${selectedUserStory.id}`,
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
          if (data.success && data.story) {
            console.log('[UserStoryDetails] ✅ Story recarregada do backend:', data.story);
            console.log('[UserStoryDetails] 🔍 PONTOS DA STORY:', {
              points: data.story.points,
              type: typeof data.story.points,
              isNumber: !isNaN(Number(data.story.points)),
              numberValue: Number(data.story.points),
              greaterThanZero: Number(data.story.points) > 0
            });
            console.log('[UserStoryDetails] 🗳️ VOTOS DA STORY:', data.story.votes);
            setStory(data.story);
            setStatus(data.story.status || 'backlog');
            
            // Se a story tem votos, setá-los diretamente
            if (data.story.votes && Array.isArray(data.story.votes) && data.story.votes.length > 0) {
              console.log('[UserStoryDetails] ✅ Setando votos da story:', data.story.votes);
              setVotes(data.story.votes);
            }
          } else {
            // Se não conseguir carregar do backend, usar dados do contexto como fallback
            setStory(selectedUserStory);
            // Também verificar votos no contexto
            if (selectedUserStory.votes && Array.isArray(selectedUserStory.votes)) {
              setVotes(selectedUserStory.votes);
            }
          }
        } else {
          // Se erro no backend, usar dados do contexto como fallback
          setStory(selectedUserStory);
          // Também verificar votos no contexto
          if (selectedUserStory.votes && Array.isArray(selectedUserStory.votes)) {
            setVotes(selectedUserStory.votes);
          }
        }
      } catch (error) {
        console.error('[UserStoryDetails] Erro ao recarregar story:', error);
        // Em caso de erro, usar dados do contexto
        setStory(selectedUserStory);
        // Também verificar votos no contexto
        if (selectedUserStory?.votes && Array.isArray(selectedUserStory.votes)) {
          setVotes(selectedUserStory.votes);
        }
      } finally {
        setLoading(false);
      }
    };

    loadStory();
    loadVotingHistory();
  }, [selectedUserStory?.id]);

  // Carregar histórico de votação
  const loadVotingHistory = async () => {
    if (!selectedUserStory?.id) return;
    
    setLoadingVotes(true);
    try {
      // Tentar carregar do localStorage primeiro
      const votesKey = `scrumpoker_votes_${selectedUserStory.id}`;
      const localVotes = JSON.parse(localStorage.getItem(votesKey) || '[]');
      
      console.log('[UserStoryDetails] ===========================================');
      console.log('[UserStoryDetails] Carregando votos para User Story:', selectedUserStory.id);
      console.log('[UserStoryDetails] Título:', selectedUserStory.title);
      console.log('[UserStoryDetails] Chave localStorage:', votesKey);
      console.log('[UserStoryDetails] Votos encontrados:', localVotes);
      console.log('[UserStoryDetails] ===========================================');
      
      if (localVotes.length > 0) {
        console.log('[UserStoryDetails] ✅ Votos carregados do localStorage:', localVotes);
        setVotes(localVotes);
      } else {
        // Tentar backend
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/votes?storyId=${selectedUserStory.id}`,
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
          if (data.success && Array.isArray(data.votes)) {
            console.log('[UserStoryDetails] ✅ Votos carregados do backend:', data.votes);
            setVotes(data.votes);
          }
        }
      }
    } catch (error) {
      console.log('[UserStoryDetails] ⚠️ Erro ao carregar votos:', error);
    } finally {
      setLoadingVotes(false);
    }
  };

  // Calcular estatísticas dos votos
  const calculateVotingStats = () => {
    console.log('[UserStoryDetails calculateVotingStats] 🔍 Iniciando cálculo');
    console.log('[UserStoryDetails calculateVotingStats] Votos recebidos:', votes);
    console.log('[UserStoryDetails calculateVotingStats] Quantidade de votos:', votes.length);
    
    if (votes.length === 0) {
      console.log('[UserStoryDetails calculateVotingStats] ❌ Nenhum voto encontrado');
      return null;
    }

    const numericVotes = votes
      .map(v => v.value || v.vote) // ✅ Aceita tanto 'value' quanto 'vote' para compatibilidade
      .filter(v => v && v !== '?' && v !== '☕')
      .map(v => {
        // Converte tamanhos de T-Shirt para números
        const sizeMap: Record<string, number> = { 
          'XXS': 1, 'XS': 2, 'S': 3, 'M': 5, 'L': 8, 'XL': 13, 'XXL': 21 
        };
        return sizeMap[v] || parseInt(v) || 0;
      });

    console.log('[UserStoryDetails calculateVotingStats] Votos numéricos:', numericVotes);
    console.log('[UserStoryDetails calculateVotingStats] Quantidade de votos numéricos:', numericVotes.length);

    if (numericVotes.length === 0) {
      console.log('[UserStoryDetails calculateVotingStats] ❌ Nenhum voto numérico válido');
      return null;
    }

    const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
    const min = Math.min(...numericVotes);
    const max = Math.max(...numericVotes);
    
    const stats = { 
      avg: avg.toFixed(1), 
      min, 
      max,
      totalVotes: votes.length,
      validVotes: numericVotes.length
    };
    
    console.log('[UserStoryDetails calculateVotingStats] ✅ Estatísticas calculadas:', stats);
    return stats;
  };

  const votingStats = calculateVotingStats();
  
  console.log('[UserStoryDetails] 📊 VOTING STATS:', votingStats);
  console.log('[UserStoryDetails] 📝 STORY POINTS:', story?.points);
  console.log('[UserStoryDetails] 🔢 STORY POINTS > 0?:', story?.points && Number(story.points) > 0);

  const statusOptions = [
    { id: 'backlog', label: 'Referencial', color: 'bg-slate-100 text-slate-700' },
    { id: 'todo', label: 'A Fazer', color: 'bg-blue-100 text-blue-700' },
    { id: 'inProgress', label: 'Em Curso', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'done', label: 'Concluído', color: 'bg-green-100 text-green-700' },
  ];

  // ✅ Determinar pontos a mostrar: pontos salvos OU média dos votos
  const displayPoints = story?.points && Number(story.points) > 0 
    ? Number(story.points) 
    : (votingStats ? Math.round(parseFloat(votingStats.avg)) : null);
  
  const hasEstimate = displayPoints !== null && displayPoints > 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

   const handleStatusChange = async (newStatus: typeof status) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories/${selectedUserStory?.id}`,
       {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      setStatus(newStatus);
      toast.success(`Status alterado para ${statusOptions.find(s => s.id === newStatus)?.label}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Tem certeza que deseja apagar esta user story?');
    if (!confirmed) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories/${selectedUserStory?.id}`,
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

      toast.success('User Story apagada com sucesso');
      onBack();
    } catch (error) {
      console.error('Erro ao apagar user story:', error);
      toast.error('Erro ao apagar user story');
    }
  };

  // Função para salvar as edições
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    const updatedStory = {
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      acceptanceCriteria: editCriteria,
      team: editTeam
    };

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories/${selectedUserStory?.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedStory),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao salvar as edições');
      }

      const data = await response.json();
      if (data.success && data.story) {
        setStory(data.story);
        toast.success('User Story atualizada com sucesso');
      } else {
        toast.error('Erro ao salvar as edições');
      }
    } catch (error) {
      console.error('Erro ao salvar as edições:', error);
      toast.error('Erro ao salvar as edições');
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  // Função para adicionar um novo critério de aceitação
  const handleAddCriterion = () => {
    if (!newCriterion.trim()) return;
    setEditCriteria([...editCriteria, newCriterion.trim()]);
    setNewCriterion('');
  };

  // Função para remover um critério de aceitação
  const handleRemoveCriterion = (index: number) => {
    const newCriteria = editCriteria.filter((_, i) => i !== index);
    setEditCriteria(newCriteria);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-3" size={40} style={{ color: primaryColor }} />
          <p className="text-slate-600 text-[14px]">Carregando user story...</p>
        </div>
      </div>
    );
  }

  // No story selected
  if (!story) {
    return (
      <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif]">
        <div 
          className="px-6 pt-6 pb-3 rounded-b-[20px] shadow-md"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="max-w-[390px] mx-auto flex items-center justify-between">
            <button 
              onClick={onBack}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="text-white" size={20} />
            </button>
             <h1 className="text-white text-[14px]">User Story</h1>
            <div className="w-9" />
          </div>
        </div>

        <div className="max-w-[390px] mx-auto px-6 py-12 text-center">
          <AlertCircle className="text-slate-300 mx-auto mb-3" size={48} />
          <h3 className="text-[15px] text-slate-800 mb-2">User story não encontrada</h3>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2 rounded-lg text-white text-[14px]"
            style={{ backgroundColor: primaryColor }}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24">
      {/* Header Compacto - FIXO */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 px-6 pt-6 pb-3 rounded-b-[20px] shadow-md"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-[390px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={onBack}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="text-white" size={20} />
            </button>
            <h1 className="text-white text-[14px]">Detalhes da User Story</h1>
            {isFormador && (
              <div className="flex gap-2">
                {!hasEstimate && (
                  <button 
                    onClick={async () => {
                      setEditTitle(story.title || '');
                      setEditDescription(story.description || '');
                      setEditPriority(story.priority || 'medium');
                      setEditCriteria(story.acceptanceCriteria || []);
                      setEditTeam(story.team || '');
                      setIsEditing(true);
                      
                      // Carregar equipas do curso
                      setLoadingTeams(true);
                      try {
                        const courseId = story.courseId;
                        if (courseId) {
                          const response = await fetch(
                            `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams?courseId=${courseId}`,
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
                            if (data.success && Array.isArray(data.teams)) {
                              setTeams(data.teams);
                            }
                          }
                        }
                      } catch (error) {
                        console.error('Erro ao carregar equipas:', error);
                      } finally {
                        setLoadingTeams(false);
                      }
                    }}
                    className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-blue-500/30 transition-colors"
                    aria-label="Editar user story"
                  >
                    <Edit className="text-white" size={18} />
                  </button>
                )}
                <button 
                  onClick={handleDelete}
                  className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-red-500/30 transition-colors"
                  aria-label="Apagar user story"
                >
                  <Trash2 className="text-white" size={18} />
                </button>
              </div>
            )}
            {!isFormador && <div className="w-9" />}
          </div>

          {/* Tags compactas */}
          <div className="flex gap-2 flex-wrap items-center">
            {story.points && Number(story.points) > 0 && (
              <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-[11px] font-medium">
                {story.points} pts
              </span>
            )}
            <span className={`backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-[11px] capitalize ${
              story.priority === 'high' ? 'bg-red-500/30' :
              story.priority === 'medium' ? 'bg-orange-500/30' :
              'bg-blue-500/30'
            }`}>
              {getPriorityLabel(story.priority || 'medium')}
            </span>
          </div>
        </div>
      </div>

      {/* Content - com padding-top para compensar o header fixo */}
      <div className="max-w-[390px] mx-auto px-6 pt-32 pb-6 space-y-4">
        {/* Título */}
        <div className="bg-white rounded-[16px] p-4 shadow-sm">
          <h2 className="text-[16px] text-slate-800 font-medium">{story.title}</h2>
        </div>

        {/* Estimativa de Pontos - Destaque */}
        <div className={`rounded-[16px] p-4 shadow-lg ${ 
          hasEstimate
            ? `bg-gradient-to-br ${isFormador ? 'from-green-500 to-green-600' : 'from-[#0b87ac] to-[#096d8a]'}`
            : 'bg-gradient-to-br from-slate-400 to-slate-500'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-white/80 text-[11px]">Estimativa Scrum Poker</p>
                {hasEstimate ? (
                  <span 
                    className="text-white px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: isFormador ? '#22c55e' : '#0b87ac' }}
                  >
                    {story?.points && Number(story.points) > 0 ? 'Estimado' : 'Média da votação'}
                  </span>
                ) : (
                  <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                    Não estimado
                  </span>
                )}
              </div>
              <p className="text-white text-[24px] font-bold">
                {hasEstimate ? `${displayPoints} pontos` : 'Não estimado'}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
              <Target className="text-white" size={24} />
            </div>
          </div>
          {hasEstimate ? (
            <p className="text-white/70 text-[11px]">
              {story?.points && Number(story.points) > 0 
                ? '✅ Estimativa definida pela equipa' 
                : '📊 Baseado na média dos votos'}
            </p>
          ) : (
            <p className="text-white/70 text-[11px]">
              ⏳ Aguardando votação no Scrum Poker
            </p>
          )}
        </div>

        {/* Estatísticas de Votação */}
        {votingStats && (
          <div className="bg-white rounded-[16px] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Vote size={16} className="text-slate-600" />
              <h3 className="text-[14px] text-slate-800 font-medium">Resultado da Votação</h3>
            </div>
            
            {/* Estatísticas principais */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[12px] p-3 text-center">
                <p className="text-[11px] text-blue-600 mb-1">Média</p>
                <p className="text-[20px] font-bold text-blue-700">{votingStats.avg}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-[12px] p-3 text-center">
                <p className="text-[11px] text-green-600 mb-1">Mínimo</p>
                <p className="text-[20px] font-bold text-green-700">{votingStats.min}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-[12px] p-3 text-center">
                <p className="text-[11px] text-orange-600 mb-1">Máximo</p>
                <p className="text-[20px] font-bold text-orange-700">{votingStats.max}</p>
              </div>
            </div>

            {/* Votos individuais */}
            <div className="space-y-2">
              <p className="text-[12px] text-slate-500 font-medium mb-2">
                Votos da equipa ({votingStats.validVotes}/{votingStats.totalVotes})
              </p>
              {votes.map((vote, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between bg-slate-50 rounded-[10px] p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
                      {(vote.userName || vote.studentName)?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-[13px] text-slate-700">{vote.userName || vote.studentName}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-[8px] text-[13px] font-bold ${
                    (vote.value || vote.vote) === '?' || (vote.value || vote.vote) === '☕' 
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {vote.value || vote.vote}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Selector - apenas para formandos */}
        {!isFormador && (
          <div className="bg-white rounded-[16px] p-4 shadow-sm">
            <p className="text-[13px] text-slate-600 mb-3 font-medium">Alterar Status</p>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleStatusChange(option.id as typeof status)}
                  className={`py-2.5 px-3 rounded-[10px] text-[12px] transition-all ${
                    status === option.id
                      ? 'ring-2 ring-offset-2 shadow-md ' + option.color
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status atual - apenas para formadores */}
        {isFormador && (
          <div className="bg-white rounded-[16px] p-4 shadow-sm">
            <p className="text-[13px] text-slate-600 mb-2 font-medium">Status Atual</p>
            <div className={`inline-block py-2 px-4 rounded-[10px] text-[13px] ${
              statusOptions.find(s => s.id === status)?.color || 'bg-slate-100 text-slate-700'
            }`}>
              {statusOptions.find(s => s.id === status)?.label || 'Referencial'}
            </div>
          </div>
        )}

        {/* Descrição */}
        <div className="bg-white rounded-[16px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-slate-600" />
            <h3 className="text-[14px] text-slate-800 font-medium">Descrição</h3>
          </div>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            {story.description || 'Sem descrição'}
          </p>
        </div>

        {/* Critérios de Aceitação */}
        {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
          <div className="bg-white rounded-[16px] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-slate-600" />
              <h3 className="text-[14px] text-slate-800 font-medium">Critérios de Aceitação</h3>
            </div>
            <div className="space-y-2">
              {story.acceptanceCriteria.map((criteria: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-[13px] text-slate-600 flex-1">
                    {criteria}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="bg-white rounded-[16px] p-4 shadow-sm">
          <h3 className="text-[14px] text-slate-800 font-medium mb-3">Informações</h3>
          <div className="space-y-3 text-[13px]">
            {story.assignee && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Atribuído a:</span>
                <span className="text-slate-800">{story.assignee}</span>
              </div>
            )}
            {story.team && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Equipa:</span>
                <span className="text-slate-800">{story.team}</span>
              </div>
            )}
            {story.createdAt && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Data de criação:</span>
                <span className="text-slate-800">
                  {new Date(story.createdAt).toLocaleDateString('pt-PT')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição - Full Screen  */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif]">
          {/* Header */}
          <div 
            className="px-6 pt-6 pb-4 rounded-b-[20px] shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="max-w-[390px] mx-auto">
              <div className="flex items-center justify-between mb-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="text-white" size={20} />
                </button>
                <h1 className="text-white text-[14px] font-medium">Editar User Story</h1>
                <button
                  onClick={handleSave}
                  disabled={saving || !editTitle.trim()}
                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="text-white animate-spin" size={18} />
                  ) : (
                    <span className="text-white text-[13px] font-medium">Guardar</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-[390px] mx-auto space-y-4">
              {/* Título */}
              <div>
                <label htmlFor="edit-title" className="block text-[13px] font-medium text-slate-700 mb-2">
                  Título *
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-[12px] text-[14px] focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ focusRing: primaryColor }}
                  placeholder="Ex: Criar sistema de login"
                />
              </div>

              {/* Descrição */}
              <div>
                <label htmlFor="edit-description" className="block text-[13px] font-medium text-slate-700 mb-2">
                  Descrição
                </label>
                <textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-slate-200 rounded-[12px] text-[14px] resize-none focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ focusRing: primaryColor }}
                  placeholder="Como [tipo de utilizador], quero [objetivo], para [benefício]"
                />
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-2">
                  Prioridade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setEditPriority(priority)}
                      className={`py-2.5 px-3 rounded-[10px] text-[12px] transition-all ${
                        editPriority === priority
                          ? `${getPriorityColor(priority)} ring-2 ring-offset-2 shadow-md`
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {getPriorityLabel(priority)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Critérios de Aceitação */}
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-2">
                  Critérios de Aceitação
                </label>
                
                {/* Lista de critérios existentes */}
                {editCriteria.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {editCriteria.map((criterion, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-slate-50 rounded-[10px] p-3"
                      >
                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-[13px] text-slate-700 flex-1">{criterion}</span>
                        <button
                          onClick={() => handleRemoveCriterion(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          aria-label="Remover critério"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adicionar novo critério */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCriterion}
                    onChange={(e) => setNewCriterion(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCriterion();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ focusRing: primaryColor }}
                    placeholder="Adicionar critério..."
                  />
                  <button
                    onClick={handleAddCriterion}
                    disabled={!newCriterion.trim()}
                    className="px-4 py-2.5 rounded-[10px] text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Equipa */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13px] font-medium text-slate-700">
                    Equipa {!hasEstimate && '*'}
                  </label>
                  {hasEstimate && (
                    <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      🔒 Story estimada
                    </span>
                  )}
                </div>
                
                {loadingTeams ? (
                  <div className="w-full px-4 py-3 border border-slate-200 rounded-[12px] bg-slate-50 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-slate-400" />
                    <span className="text-[13px] text-slate-500">Carregando equipas...</span>
                  </div>
                ) : (
                  <select
                    value={editTeam}
                    onChange={(e) => setEditTeam(e.target.value)}
                    disabled={hasEstimate}
                    className={`w-full px-4 py-3 border border-slate-200 rounded-[12px] text-[14px] focus:outline-none focus:ring-2 focus:border-transparent ${
                      hasEstimate ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
                    }`}
                    style={{ focusRing: primaryColor }}
                  >
                    <option value="">Selecionar equipa...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                )}
                
                {hasEstimate && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    ⚠️ A equipa não pode ser alterada porque esta user story já foi estimada no Scrum Poker.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
