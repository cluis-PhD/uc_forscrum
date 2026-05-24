import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  CheckCircle,
  Circle,
  Loader2,
  AlertCircle,
  Search,
  X
} from 'lucide-react';
import { toast } from "sonner";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useApp } from '../context/AppContext';

interface UserStory {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'doing' | 'done';
  points?: number;
  courseId: string;
  isAssigned?: boolean;
}

interface ManageSprintStoriesProps {
  sprintId: string;
  sprintName: string;
  onBack: () => void;
}

export function ManageSprintStories({ sprintId, sprintName, onBack }: ManageSprintStoriesProps) {
  const { userType } = useApp();
  const primaryColor = userType === 'formador' ? '#4aa540' : '#0b87ac';
  
  const [allStories, setAllStories] = useState<UserStory[]>([]);
  const [assignedStories, setAssignedStories] = useState<string[]>([]);
  const [initialAssignedStories, setInitialAssignedStories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [sprintId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Carregar todas as user stories
      const storiesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!storiesResponse.ok) {
        throw new Error('Erro ao carregar user stories');
      }

      const storiesData = await storiesResponse.json();
      console.log('[ManageSprintStories] Stories carregadas:', storiesData);
      setAllStories(storiesData.stories || []);

      // Carregar user stories associadas ao sprint
      const sprintStoriesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/sprint-stories/${sprintId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log('[ManageSprintStories] Sprint stories response status:', sprintStoriesResponse.status);
      
      if (sprintStoriesResponse.ok) {
        const sprintStoriesData = await sprintStoriesResponse.json();
        console.log('[ManageSprintStories] Sprint stories carregadas:', sprintStoriesData);
        setAssignedStories(sprintStoriesData.storyIds || []);
        setInitialAssignedStories(sprintStoriesData.storyIds || []);
      } else {
        console.log('[ManageSprintStories] Sprint ainda não tem stories associadas');
        setAssignedStories([]);
        setInitialAssignedStories([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      toast.error('Erro ao carregar user stories');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStory = (storyId: string) => {
    console.log('[ManageSprintStories] Toggle story:', storyId);
    setAssignedStories(prev => {
      const newAssigned = prev.includes(storyId) 
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId];
      console.log('[ManageSprintStories] Stories atualizadas:', newAssigned);
      return newAssigned;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('[ManageSprintStories] Salvando stories:', assignedStories);
      console.log('[ManageSprintStories] Sprint ID:', sprintId);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/sprint-stories/${sprintId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storyIds: assignedStories }),
        }
      );

      const data = await response.json();
      console.log('[ManageSprintStories] Resposta do servidor:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar');
      }

      toast.success('User stories atualizadas com sucesso!');
      onBack();
    } catch (err) {
      console.error('Error saving stories:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

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

  const filteredStories = allStories.filter(story => 
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasUnsavedChanges = JSON.stringify(assignedStories.sort()) !== JSON.stringify(initialAssignedStories.sort());

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('Tem alterações não guardadas. Deseja sair sem guardar?');
      if (!confirmed) return;
    }
    onBack();
  };

  if (isLoading) {
    return (
      <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="text-[#4aa540] animate-spin mb-4" size={40} />
          <p className="text-slate-600 text-[14px]">Carregando user stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif]">
      {/* Header - Super Compacto */}
      <div 
        className="px-6 pt-6 pb-3 rounded-b-[20px] shadow-md"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-[390px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={handleBackClick}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="text-white" size={20} />
            </button>
            <h1 className="text-white text-[14px]">Gerir User Stories</h1>
            <div className="bg-white rounded-full px-2.5 py-1">
              <span className="text-[12px] font-semibold" style={{ color: primaryColor }}>
                {assignedStories.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[390px] mx-auto px-6 py-6 space-y-4 pb-40">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar user stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-none rounded-[12px] pl-11 pr-10 py-3.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-offset-0 shadow-sm"
            style={{ 
              focusRingColor: primaryColor 
            }}
            aria-label="Pesquisar user stories"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              aria-label="Limpar pesquisa"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {error && (
          <div className="bg-white rounded-[16px] p-4 shadow-sm border-l-4 border-red-500">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-600 text-[13px] flex-1">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="w-full text-white py-2.5 rounded-[10px] text-[13px] font-medium hover:opacity-90 transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* User Stories List */}
        {filteredStories.length === 0 ? (
          <div className="bg-white rounded-[16px] p-8 shadow-sm text-center">
            <Circle className="text-slate-300 mx-auto mb-3" size={48} />
            <h3 className="text-[15px] text-slate-800 mb-2">
              {searchQuery ? 'Nenhuma user story encontrada' : 'Nenhuma user story disponível'}
            </h3>
            <p className="text-[13px] text-slate-500">
              {searchQuery 
                ? 'Tente pesquisar por outros termos' 
                : 'Crie user stories no Referencial primeiro'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStories.map((story) => {
              const isAssigned = assignedStories.includes(story.id);
              
              return (
                <button
                  key={story.id}
                  onClick={() => toggleStory(story.id)}
                  className={`w-full bg-white rounded-[12px] p-4 shadow-sm hover:shadow-md transition-all text-left border-2 ${
                    isAssigned 
                      ? 'border-opacity-100' 
                      : 'border-transparent'
                  }`}
                  style={{
                    borderColor: isAssigned ? primaryColor : 'transparent'
                  }}
                  role="checkbox"
                  aria-checked={isAssigned}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isAssigned ? (
                        <CheckCircle className="transition-all" style={{ color: primaryColor }} size={22} />
                      ) : (
                        <Circle className="text-slate-300" size={22} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] text-slate-800 font-medium mb-1">{story.title}</h4>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${getPriorityColor(story.priority)}`}>
                          {getPriorityLabel(story.priority)}
                        </span>
                        {story.points && (
                          <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                            {story.points} pts
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-500 leading-relaxed">
                        {story.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50" style={{ boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div className="max-w-[390px] mx-auto space-y-3">
          {/* Indicador de alterações não guardadas */}
          {hasUnsavedChanges && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 flex items-center gap-2">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={18} />
              <p className="text-amber-700 text-[13px] font-medium">Tem alterações não guardadas</p>
            </div>
          )}
          
          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={handleBackClick}
              disabled={isSaving}
              className="flex-1 bg-slate-200 text-slate-700 py-3.5 rounded-xl text-[14px] font-medium hover:bg-slate-300 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] text-white py-3.5 rounded-xl text-[15px] font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Guardar Alterações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
