import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ArrowLeft, Plus, Search, Filter, MoreVertical, GripVertical, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { mockAPI } from '../utils/supabase/mock-api';
import { useApp } from '../context/AppContext';
import { Header } from './shared/Header';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface UserStory {
  id: string;
  title: string;
  points: number;
  priority: 'high' | 'medium' | 'low';
  team?: string;
  assignee?: string;
  votes?: Array<{ studentId: string; value: number }>;
}

interface SprintBoardProps {
  userType: 'formador' | 'formando';
  onBack: () => void;
  onCreateStory?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
  sprintId?: string;
  teamId?: string;
}

interface DragItem {
  id: string;
  columnId: string;
}

function StoryCard({ 
  story, 
  columnId, 
  isDraggable,
  onEdit,
  onDelete,
  userType
}: { 
  story: UserStory; 
  columnId: string;
  isDraggable: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  userType?: 'formador' | 'formando';
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const isFormador = userType === 'formador';

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'story',
    item: { id: story.id, columnId },
    canDrag: isDraggable,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit(story.id);
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(story.id, story.title);
    setShowDeleteConfirm(false);
  };

  if (showDeleteConfirm) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-red-300">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="text-red-500" size={20} />
          <h4 className="text-sm text-slate-800 font-medium">Confirmar Exclusão</h4>
        </div>
        <p className="text-xs text-slate-600 mb-4">
          Tem certeza que deseja apagar esta user story?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg text-xs hover:bg-slate-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmDelete}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg text-xs hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
          >
            <Trash2 size={14} />
            Apagar
          </button>
        </div>
      </div>
    );
  }

  // Verificar se tem pontos válidos
  const hasPoints = story.points !== null && story.points !== undefined && Number(story.points) > 0;
  const pointsValue = Number(story.points) || 0;

  // Calcular média dos votos
  const calculateAverageVote = () => {
    if (!story.votes || story.votes.length === 0) return null;
    const sum = story.votes.reduce((acc, vote) => acc + vote.value, 0);
    return Math.round(sum / story.votes.length);
  };

  const averageVote = calculateAverageVote();
  
  // 🔍 DEBUG TEMPORÁRIO
  if (story.title.includes('Story')) {
    console.log('🐛 DEBUG BADGE:', {
      title: story.title,
      points: story.points,
      pointsType: typeof story.points,
      hasPoints,
      votes: story.votes,
      votesLength: story.votes?.length,
      averageVote
    });
  }

  return (
    <div
      ref={drag}
      onClick={handleEdit}
      className={`bg-white rounded-xl p-3 shadow-sm border-2 border-transparent hover:border-[#4aa540] transition-all relative cursor-pointer hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm text-slate-800 flex-1 pr-2">{story.title}</h4>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className={`${getPriorityColor(story.priority)} px-2 py-0.5 rounded-md text-xs`}>
          {story.priority === 'high' ? 'Alta' : story.priority === 'medium' ? 'Média' : 'Baixa'}
        </span>
        {pointsValue > 0 ? (
          <span 
            className="text-white px-2 py-0.5 rounded-md text-xs font-semibold"
            style={{ backgroundColor: isFormador ? '#4aa540' : '#0b87ac' }}
          >
            {pointsValue} pts
          </span>
        ) : averageVote !== null ? (
          <span 
            className="text-white px-2 py-0.5 rounded-md text-xs font-semibold"
            style={{ backgroundColor: isFormador ? '#4aa540' : '#60a5fa' }}
            title={`Média de ${story.votes?.length} voto(s)`}
          >
            {averageVote} pts
          </span>
        ) : (
          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-xs">
            Sem votos
          </span>
        )}
      </div>

      {story.assignee && (
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[0.6rem]">
            {story.assignee.split(' ').map(n => n[0]).join('')}
          </div>
          <span>{story.assignee}</span>
        </div>
      )}

      {story.team && (
        <p className="text-xs text-slate-400 mt-1">{story.team}</p>
      )}
    </div>
  );
}

function Column({ 
  column, 
  stories, 
  onDrop,
  canDrag,
  onEditStory,
  onDeleteStory,
  isFormador,
  onAddUserStories
}: { 
  column: { id: string; title: string; color: string };
  stories: UserStory[];
  onDrop: (item: DragItem, columnId: string) => void;
  canDrag: boolean;
  onEditStory: (id: string) => void;
  onDeleteStory: (id: string, title: string) => void;
  isFormador?: boolean;
  onAddUserStories?: () => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'story',
    drop: (item: DragItem) => onDrop(item, column.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const getTotalPoints = () => {
    return stories.reduce((sum, story) => sum + story.points, 0);
  };

  return (
    <div 
      ref={drop}
      className={`flex-shrink-0 w-[280px] ${column.color} rounded-2xl p-4 ${
        isOver ? 'ring-2 ring-[#4aa540]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm text-slate-800">{column.title}</h3>
        <div className="flex items-center gap-2">
          <span className="bg-white/50 px-2 py-1 rounded-md text-xs text-slate-600">
            {stories.length}
          </span>
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs">
            {getTotalPoints()} pts
          </span>
        </div>
      </div>

      <div className="space-y-2 min-h-[200px]">{stories.map((story) => (
        <StoryCard 
          key={story.id} 
          story={story} 
          columnId={column.id} 
          isDraggable={canDrag} 
          onEdit={onEditStory}
          onDelete={onDeleteStory}
          userType={isFormador ? 'formador' : 'formando'}
        />
      ))}</div>
    </div>
  );
}

function SprintBoardContent({ userType, onBack, onCreateStory, onNavigate, sprintId, teamId }: SprintBoardProps) {
  const isFormador = userType === 'formador';
  const primaryColor = isFormador ? '#4aa540' : '#0b87ac';
  const { selectedUserStory, selectedCourse, loggedStudent, setSelectedUserStory, setPreviousScreen } = useApp();

  console.log('📥📥📥 ════════════════════════════════════════════════');
  console.log('[SprintBoard] 📥 PROPS RECEBIDAS:');
  console.log('[SprintBoard] userType:', userType);
  console.log('[SprintBoard] sprintId (prop):', sprintId);
  console.log('[SprintBoard] teamId (prop):', teamId);
  console.log('[SprintBoard] selectedCourse (context):', selectedCourse);
  console.log('[SprintBoard] loggedStudent (context):', loggedStudent);
  console.log('📥📥📥 ════════════════════════════════════════════════');

  const [selectedStoryForPoker, setSelectedStoryForPoker] = useState<UserStory | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentSprint, setCurrentSprint] = useState<any>(null);
  const [loadingSprint, setLoadingSprint] = useState(true);

  const [stories, setStories] = useState<Record<string, UserStory[]>>({
    backlog: [],
    todo: [],
    inProgress: [],
    done: [],
  });

  useEffect(() => {
    console.log('[SprintBoard] Componente montado/remontado - carregando dados...');
    
    setSelectedUserStory(null);
    
    loadSprintData();
    
    const intervalId = setInterval(() => {
      console.log('[SprintBoard] 🔄 Auto-reload - A recarregar dados...');
      loadSprintData();
    }, 30000);

    return () => {
      console.log('[SprintBoard] 🛑 Limpando polling automático');
      clearInterval(intervalId);
    };
  }, [selectedCourse, loggedStudent]);

  useEffect(() => {
    if (currentSprint) {
      console.log('[SprintBoard] Sprint mudou, recarregando stories...', currentSprint);
      loadUserStories();
    }
  }, [currentSprint]);

  const loadSprintData = async () => {
    await loadActiveSprint();
  };

  const loadActiveSprint = async () => {
    try {
      setLoadingSprint(true);
      
      console.log('[SprintBoard] ========================================');
      console.log('[SprintBoard] Carregando sprint ativo...');
      console.log('[SprintBoard] User Type:', userType);
      console.log('[SprintBoard] Course ID:', selectedCourse?.id);
      console.log('[SprintBoard] Team ID (formando):', teamId || loggedStudent?.teamId);
      console.log('[SprintBoard] SprintId passado:', sprintId);
      
      let data: any = null;
      let success = false;
      
      try {
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

        console.log('[SprintBoard] Response status:', response.status);
        console.log('[SprintBoard] Response OK?:', response.ok);

        if (response.ok) {
          data = await response.json();
          success = true;
          console.log('[SprintBoard] ✅ Dados recebidos do backend:', data);
        }
      } catch (fetchError) {
        console.log('[SprintBoard] ⚠️ Backend não disponível, usando Mock API...');
      }
      
      if (!success) {
        console.log('[SprintBoard] 🔄 Fallback para Mock API...');
        const result = await mockAPI.getSprints();
        
        if (result.success) {
          data = result;
          success = true;
          console.log('[SprintBoard] ✅ Dados recebidos do Mock API:', data);
        }
      }
      
      if (success && data?.success && Array.isArray(data.sprints)) {
        console.log('[SprintBoard] Total de sprints recebidos:', data.sprints.length);
        
        let filteredSprints: any[];
        
        // CORREÇÃO: Sprints não têm teamId, então apenas filtrar por courseId
        console.log('[SprintBoard] Filtrando por courseId:', selectedCourse?.id);
        filteredSprints = data.sprints.filter((s: any) => 
          s.courseId === selectedCourse?.id
        );
        console.log('[SprintBoard] Sprints do curso:', filteredSprints.length);
        
        let activeSprint;
        if (sprintId) {
          console.log('[SprintBoard] 🎯 Procurando sprint específico:', sprintId);
          activeSprint = filteredSprints.find((s: any) => s.id === sprintId);
        } else {
          activeSprint = filteredSprints.find((s: any) => s.status === 'active') || filteredSprints[0];
        }
        
        if (activeSprint) {
          setCurrentSprint(activeSprint);
          console.log('[SprintBoard] ✅ Sprint carregado:', activeSprint);
        } else {
          console.log('[SprintBoard] ⚠️ Nenhum sprint encontrado');
          setCurrentSprint(null);
        }
      } else {
        console.warn('[SprintBoard] ⚠️ Nenhum dado válido recebido');
      }
      
      console.log('[SprintBoard] ========================================');
    } catch (error) {
      console.error('[SprintBoard] ❌ ERRO ao carregar sprint:', error);
      console.log('[SprintBoard] ========================================');
    } finally {
      setLoadingSprint(false);
    }
  };

  const loadUserStories = async () => {
    try {
      setLoading(true);
      
      if (!currentSprint?.id) {
        console.log('[SprintBoard] Aguardando sprint ativo...');
        setStories({
          backlog: [],
          todo: [],
          inProgress: [],
          done: [],
        });
        setLoading(false);
        return;
      }

      console.log('[SprintBoard] Carregando stories para sprint:', currentSprint.id, currentSprint.name);

      let data: any = null;
      let success = false;
      
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
          data = await response.json();
          success = true;
          console.log('[SprintBoard] ✅ Stories recebidas do backend');
        }
      } catch (fetchError) {
        console.log('[SprintBoard] ⚠️ Backend não disponível para stories, usando Mock API...');
      }
      
      if (!success) {
        console.log('[SprintBoard] 🔄 Fallback para Mock API (stories)...');
        const result = await mockAPI.getStories();
        
        if (result.success) {
          data = result;
          success = true;
          console.log('[SprintBoard] ✅ Stories recebidas do Mock API');
        }
      }
      
      // CORREÇÃO: Para formandos, usar courseId do estudante e teamId
      const courseIdToFilter = !isFormador 
        ? loggedStudent?.courseId || selectedCourse?.id
        : selectedCourse?.id;
      
      // CORREÇÃO: Para formandos, usar o NOME da equipa (não teamId)
      const teamNameToFilter = !isFormador 
        ? loggedStudent?.teamName
        : null;
      
      console.log('📊📊📊 ════════════════════════════════════════════════');
      console.log('[SprintBoard loadUserStories] 📊 FILTROS:');
      console.log('[SprintBoard loadUserStories] isFormador:', isFormador);
      console.log('[SprintBoard loadUserStories] courseIdToFilter:', courseIdToFilter);
      console.log('[SprintBoard loadUserStories] teamNameToFilter:', teamNameToFilter);
      console.log('[SprintBoard loadUserStories] loggedStudent COMPLETO:', loggedStudent);
      console.log('[SprintBoard loadUserStories] currentSprint.id:', currentSprint.id);
      console.log('[SprintBoard loadUserStories] currentSprint.name:', currentSprint.name);
      console.log('[SprintBoard loadUserStories] Total stories recebidas:', data?.stories?.length || 0);
      console.log('📊📊📊 ═══════════════════════════════════════════════');
      
      if (success && data?.success && Array.isArray(data.stories)) {
        const organizedStories: Record<string, UserStory[]> = {
          backlog: [],
          todo: [],
          inProgress: [],
          done: [],
        };
        
        console.log('🔍🔍🔍 ════════════════════════════════════════════════');
        console.log('[SprintBoard] 🔍 PROCESSANDO STORIES:');
        console.log('[SprintBoard] Total stories recebidas:', data.stories.length);
        console.log('[SprintBoard] Primeira story (exemplo):', data.stories[0]);
        console.log('🔍🔍🔍 ════════════════════════════════════════════════');
        
        data.stories.forEach((story: any, index: number) => {
          console.log(`[SprintBoard] 🔍 Story #${index + 1}:`, {
            title: story.title,
            points: story.points,
            pointsType: typeof story.points,
            votes: story.votes,
            votesLength: story.votes?.length,
            courseId: story.courseId,
            team: story.team,
            sprintId: story.sprintId,
            sprintIds: story.sprintIds,
            status: story.status,
          });
          
          // CORREÇÃO: Filtro por curso
          const courseMatch = story.courseId === courseIdToFilter;
          console.log(`[SprintBoard] 📋 Filtro CURSO - story.courseId: "${story.courseId}" === courseIdToFilter: "${courseIdToFilter}" = ${courseMatch}`);
          
          if (!courseMatch) {
            console.log(`[SprintBoard] ❌ Story IGNORADA (curso diferente):`, story.title);
            return;
          }

          // CORREÇÃO: Para FORMANDOS, filtrar pelo NOME da equipa (campo "team")
          // ✅ Stories SEM equipa atribuída (team vazio) são visíveis para TODOS
          // 🚨 TEMPORARIAMENTE DESATIVADO - Mostrar todas as stories do curso
          if (false && !isFormador && teamNameToFilter) {
            const hasTeam = story.team && story.team.trim() !== '';
            const teamMatch = story.team === teamNameToFilter;
            
            console.log(`[SprintBoard] 📋 Filtro EQUIPA - story.team: "${story.team}" === teamNameToFilter: "${teamNameToFilter}" = ${teamMatch}`);
            console.log(`[SprintBoard] 📋 hasTeam: ${hasTeam}, teamMatch: ${teamMatch}`);
            
            // Só filtrar se a story TEM uma equipa específica E é diferente da do formando
            if (hasTeam && !teamMatch) {
              console.log(`[SprintBoard] ❌ Story IGNORADA (equipa diferente):`, story.title, 
                `(story.team: "${story.team}", teamNameToFilter: "${teamNameToFilter}")`);
              return;
            }
          }

          // CORREÇÃO: Filtro por sprint - aceitar stories SEM sprintId OU com sprintId igual
          // ✅ SUPORTE PARA sprintId (backend) E sprintIds (mock)
          const storySprintId = story.sprintId;
          const storySprintIds = story.sprintIds || [];
          const belongsToSprint = !storySprintId || storySprintId === currentSprint.id || storySprintIds.includes(currentSprint.id);
          
          console.log(`[SprintBoard] 📋 Filtro SPRINT:`);
          console.log(`[SprintBoard] 📋 - story.sprintId: "${storySprintId}"`);
          console.log(`[SprintBoard] 📋 - story.sprintIds: ${JSON.stringify(storySprintIds)}`);
          console.log(`[SprintBoard] 📋 - currentSprint.id: "${currentSprint.id}"`);
          console.log(`[SprintBoard] 📋 - belongsToSprint: ${belongsToSprint}`);
          
          if (!belongsToSprint) {
            console.log(`[SprintBoard] ❌ Story IGNORADA (sprint diferente):`, story.title);
            return;
          }

          console.log(`[SprintBoard] ✅ Story ACEITA:`, story.title);

          const userStory: UserStory = {
            id: story.id,
            title: story.title,
            points: story.points || 0,
            priority: story.priority || 'medium',
            team: story.team,
            assignee: story.assignee,
            votes: story.votes || []
          };

          const status = story.status || 'backlog';
          if (organizedStories[status]) {
            organizedStories[status].push(userStory);
          } else {
            organizedStories.backlog.push(userStory);
          }
        });

        setStories(organizedStories);
        console.log('[SprintBoard] User stories carregadas e organizadas:', organizedStories);
        console.log('[SprintBoard] Total de stories por coluna:', {
          backlog: organizedStories.backlog.length,
          todo: organizedStories.todo.length,
          inProgress: organizedStories.inProgress.length,
          done: organizedStories.done.length,
          total: Object.values(organizedStories).flat().length
        });
      } else if (data.stories && !Array.isArray(data.stories)) {
        console.error('[SprintBoard] data.stories não é um array:', data.stories);
        setStories({
          backlog: [],
          todo: [],
          inProgress: [],
          done: [],
        });
      } else {
        console.log('[SprintBoard] Nenhuma story encontrada nos dados do backend');
        setStories({
          backlog: [],
          todo: [],
          inProgress: [],
          done: [],
        });
      }
    } catch (error) {
      console.error('Erro ao carregar user stories:', error);
      setStories({
        backlog: [],
        todo: [],
        inProgress: [],
        done: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { id: 'backlog', title: 'Referencial', color: 'bg-slate-100' },
    { id: 'todo', title: 'A Fazer', color: 'bg-blue-50' },
    { id: 'inProgress', title: 'Em Curso', color: 'bg-yellow-50' },
    { id: 'done', title: 'Concluído', color: 'bg-green-50' },
  ];

  const canDrag = !isFormador;

  const handleDrop = async (item: DragItem, targetColumnId: string) => {
    if (isFormador) {
      toast.error('Apenas formandos podem mover stories no quadro Kanban');
      return;
    }

    if (item.columnId === targetColumnId) return;

    setStories((prev) => {
      const sourceColumn = prev[item.columnId];
      const storyIndex = sourceColumn.findIndex((s) => s.id === item.id);
      
      if (storyIndex === -1) return prev;

      const story = sourceColumn[storyIndex];
      const newSourceColumn = sourceColumn.filter((s) => s.id !== item.id);
      const newTargetColumn = [...prev[targetColumnId], story];

      return {
        ...prev,
        [item.columnId]: newSourceColumn,
        [targetColumnId]: newTargetColumn,
      };
    });

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories/${item.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: targetColumnId }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      toast.success(`Story movida para ${columns.find(c => c.id === targetColumnId)?.title}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status no servidor');
      loadUserStories();
    }
  };

  const handleEditStory = async (id: string) => {
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

      if (!response.ok) {
        throw new Error('Erro ao carregar user story');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.stories)) {
        const story = data.stories.find((s: any) => s.id === id);
        if (story) {
          setSelectedUserStory(story);
          setPreviousScreen('sprintBoard');
          onNavigate?.('userStoryDetails');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar story:', error);
      toast.error('Erro ao carregar detalhes da user story');
    }
  };

  const handleDeleteStory = async (id: string, title: string) => {
    console.log('[SprintBoard handleDeleteStory] 🗑️ Iniciando delete da story:', id, title);
    
    try {
      console.log('[SprintBoard handleDeleteStory] Chamando Mock API deleteStory...');
      const result = await mockAPI.deleteStory(id);
      
      console.log('[SprintBoard handleDeleteStory] Mock API result:', result);
      
      if (!result.success) {
        console.error('[SprintBoard handleDeleteStory] ❌ Mock API retornou erro:', result.error);
        throw new Error(result.error || 'Erro ao apagar user story');
      }

      console.log('[SprintBoard handleDeleteStory] ✅ Delete bem-sucedido! Atualizando UI...');

      setStories((prev) => {
        const newStories = { ...prev };
        
        Object.keys(newStories).forEach((columnId) => {
          newStories[columnId] = newStories[columnId].filter((s) => s.id !== id);
        });

        return newStories;
      });

      toast.success('🗑️ User Story Apagada', {
        description: `"${title}" foi removida com sucesso`,
        duration: 4000,
      });
      
      console.log('[SprintBoard handleDeleteStory] ✅ UI atualizada e toast exibido');
    } catch (error) {
      console.error('[SprintBoard handleDeleteStory] ❌ ERRO FINAL:', error);
      toast.error(`Erro ao apagar user story: ${(error as Error)?.message}`);
    }
  };

  const handleAddUserStories = () => {
    if (currentSprint) {
      onNavigate?.('manageSprintStories', { 
        sprintId: currentSprint.id, 
        sprintName: currentSprint.name 
      });
    } else {
      toast.error('Nenhum sprint selecionado');
    }
  };

  const getTotalPoints = () => {
    return Object.values(stories).flat().reduce((sum, story) => sum + story.points, 0);
  };

  const getCompletionPercentage = () => {
    const allStories = Object.values(stories).flat();
    const totalStories = allStories.length;
    const completedStories = stories.done.length;
    
    // Só mostra 100% se TODAS as stories estiverem concluídas
    return totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 dark:bg-slate-900 transition-colors duration-200 font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif]">
      {/* Header */}
      <Header
        onBack={onBack}
        title={currentSprint ? currentSprint.name : 'Sprint Board'}
        showProfile={false}
      />

      {/* Conteúdo principal - espaçamento para o header fixo */}
      <div className="w-full max-w-[390px] mx-auto px-6 pt-32 space-y-4">
        {/* Info Card - Stories Count */}
        <div 
          className="rounded-xl p-4 shadow-sm"
          style={{ backgroundColor: isFormador ? '#4aa540' : '#0b87ac' }}
        >
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-sm font-medium">{Object.values(stories).flat().length} stories</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/80">Total de Pontos</p>
              <p className="text-lg font-semibold">{getTotalPoints()} pts</p>
            </div>
          </div>
        </div>

        {/* Scrum Poker Button - Apenas para Formandos */}
        {!isFormador && (
          <button
            onClick={() => onNavigate?.('scrumPoker')}
            className="w-full rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
            style={{ backgroundColor: '#0b87ac' }}
          >
            <div className="flex items-center justify-between text-white">
              <div className="text-left">
                <h3 className="text-base font-medium mb-1">Scrum Poker</h3>
                <p className="text-white/90 text-sm">Estimar user stories em equipa</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-sm">Iniciar →</p>
              </div>
            </div>
          </button>
        )}

        {/* Drag & Drop Help - Apenas para Formandos */}
        {!isFormador && (
          <div className="bg-blue-50 border-blue-200 border-2 rounded-xl p-3 text-center dark:bg-blue-900/30 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 Arraste a sua user story entre as colunas para atualizar o estado
            </p>
          </div>
        )}
      </div>

      {/* Quadro Kanban com scroll horizontal - MANTÉM A MESMA LARGURA MÁXIMA */}
      <div className="w-full max-w-[390px] mx-auto px-6 pt-6 scrollbar-hide">
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="flex gap-4 min-w-max pb-20">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                stories={stories[column.id]}
                onDrop={handleDrop}
                canDrag={canDrag}
                onEditStory={handleEditStory}
                onDeleteStory={handleDeleteStory}
                isFormador={isFormador}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SprintBoard(props: SprintBoardProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <SprintBoardContent {...props} />
    </DndProvider>
  );
}