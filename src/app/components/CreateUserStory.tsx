import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Users as UsersIcon,
  Target,
  FileText,
  Loader2,
  Layers,
  BookOpen
} from 'lucide-react';
import { toast } from "sonner";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CreateUserStoryProps {
  onBack: () => void;
  onSave?: (story: UserStoryData) => void;
  sprintId?: string;
  sprintName?: string;
  courseId?: string;
  courseName?: string;
}

export interface UserStoryData {
  id?: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  team: string;
  acceptanceCriteria: string[];
  sprintId: string;
  courseId: string;
  createdAt?: string;
}

interface Sprint {
  id: string;
  name: string;
  goal: string;
  courseId: string;
  teamId?: string;
  courseName?: string;
}

interface Course {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

export function CreateUserStory({ onBack, onSave, sprintId: initialSprintId, sprintName: initialSprintName, courseId: initialCourseId, courseName: initialCourseName }: CreateUserStoryProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [team, setTeam] = useState('');
  const [criteria, setCriteria] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [showSummary, setShowSummary] = useState(false);
  const [createdStory, setCreatedStory] = useState<UserStoryData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingSprints, setLoadingSprints] = useState(true);
  const [sprintId, setSprintId] = useState(initialSprintId || '');
  const [courseId, setCourseId] = useState(initialCourseId || '');

  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    loadCourses();
    loadSprints();
    loadTeams();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/courses`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.courses)) {
        setCourses(data.courses);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Verifique se as credenciais do Supabase estão corretas');
        console.error('URL tentada:', `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/courses`);
      }
      setCourses([]);
    }
  };

  const loadSprints = async () => {
    try {
      setLoadingSprints(true);
      console.log('🔄 Carregando sprints...');
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Resposta do servidor (sprints):', data);
      console.log('📦 Total de sprints recebidos:', data.sprints?.length || 0);
      
      if (data.success && Array.isArray(data.sprints)) {
        console.log('✅ Sprints carregados:', data.sprints);
        setSprints(data.sprints);
      } else {
        console.warn('⚠️ Resposta não contém array de sprints:', data);
        setSprints([]);
      }
    } catch (error) {
      console.error('❌ Error loading sprints:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('❌ Verifique se as credenciais do Supabase estão corretas');
        console.error('❌ URL tentada:', `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/sprints`);
        toast.error('Erro de conexão. Verifique as credenciais do Supabase.', { duration: 5000 });
      } else {
        toast.error('Erro ao carregar sprints');
      }
      setSprints([]);
    } finally {
      setLoadingSprints(false);
    }
  };

  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      console.log('🔄 Carregando equipas...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Resposta do servidor:', data);
      
      if (data.success && Array.isArray(data.teams)) {
        console.log('✅ Equipas carregadas:', data.teams);
        setTeams(data.teams);
      } else {
        console.warn('⚠️ Resposta não contém array de equipas:', data);
        setTeams([]);
      }
    } catch (error) {
      console.error('❌ Error loading teams:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('❌ Verifique se as credenciais do Supabase estão corretas');
        console.error('❌ URL tentada:', `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams`);
        toast.error('Erro de conexão. Verifique as credenciais do Supabase.', { duration: 5000 });
      } else {
        toast.error('Erro ao carregar equipes');
      }
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    if (sprintId && !initialSprintId) {
      const selectedSprint = sprints.find(s => s.id === sprintId);
      if (selectedSprint) {
        setCourseId(selectedSprint.courseId);
      }
    }
  }, [sprintId, sprints, initialSprintId]);

  const getSprintName = () => {
    if (initialSprintName) return initialSprintName;
    const sprint = sprints.find(s => s.id === sprintId);
    return sprint?.name || '';
  };

  const getCourseName = () => {
    if (initialCourseName) return initialCourseName;
    const course = courses.find(c => c.id === courseId);
    return course?.name || '';
  };

  const validateTitle = (value: string) => {
    if (!value.trim()) return 'Título é obrigatório';
    return undefined;
  };

  const validateDescription = (value: string) => {
    if (!value.trim()) return 'Descrição é obrigatória';
    if (value.length < 10) return 'Descrição deve ter pelo menos 10 caracteres';
    return undefined;
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (touched.title) {
      const error = validateTitle(value);
      setErrors(prev => ({ ...prev, title: error || '' }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (touched.description) {
      const error = validateDescription(value);
      setErrors(prev => ({ ...prev, description: error || '' }));
    }
  };

  const addCriteria = () => {
    setCriteria([...criteria, '']);
  };

  const updateCriteria = (index: number, value: string) => {
    const newCriteria = [...criteria];
    newCriteria[index] = value;
    setCriteria(newCriteria);
  };

  const removeCriteria = (index: number) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    setTouched({ title: true, description: true, team: true, sprint: true });

    const titleError = validateTitle(title);
    const descError = validateDescription(description);
    const teamError = !team ? 'Selecione uma equipa' : undefined;
    const sprintError = !sprintId ? 'Selecione um sprint' : undefined;

    setErrors({
      title: titleError || '',
      description: descError || '',
      team: teamError || '',
      sprint: sprintError || '',
    });

    if (titleError || descError || teamError || sprintError) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    const validCriteria = criteria.filter(c => c.trim());
    if (validCriteria.length === 0) {
      toast.error('Adicione pelo menos um critério de aceitação');
      return;
    }

    if (!courseId) {
      toast.error('Erro: Curso não identificado para o sprint selecionado');
      return;
    }

    const storyData: UserStoryData = {
      title,
      description,
      priority,
      team,
      acceptanceCriteria: validCriteria,
      sprintId,
      courseId,
    };

    setIsSaving(true);
    try {
      console.log('Criando user story com dados:', storyData);
      console.log('URL:', `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(storyData),
        }
      );

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Response is not JSON:', text);
        throw new Error(`Servidor retornou resposta não-JSON: ${text.substring(0, 100)}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar user story');
      }

      setCreatedStory(data.userStory);
      setShowSummary(true);
      onSave?.(data.userStory);
      
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error creating user story:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar user story');
    } finally {
      setIsSaving(false);
    }
  };

  if (showSummary && createdStory) {
    return (
      <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 pt-[100px] flex items-center justify-center px-6">
        <div className="bg-white rounded-[24px] shadow-lg p-6 w-full max-w-[390px] animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-[#4aa540]" size={32} />
            </div>
            <h2 className="text-[20px] font-bold text-slate-800">User Story Criada!</h2>
            <p className="text-slate-500 text-[14px]">A user story foi adicionada com sucesso</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-slate-50 rounded-[12px] p-4 text-left">
              <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Título</p>
              <p className="text-[16px] text-slate-800 font-medium">{createdStory.title}</p>
            </div>
            
            <div className="bg-slate-50 rounded-[12px] p-4 text-left">
              <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Descrição</p>
              <p className="text-[14px] text-slate-700">{createdStory.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-[12px] p-3 text-left">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Prioridade</p>
                <span className={`inline-block px-2 py-1 rounded-[6px] text-[12px] font-medium ${
                  createdStory.priority === 'high' ? 'bg-red-100 text-red-700' :
                  createdStory.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {createdStory.priority === 'high' ? 'Alta' : createdStory.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
              </div>
              <div className="bg-slate-50 rounded-[12px] p-3 text-left">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Equipa</p>
                <p className="text-[13px] text-slate-800">{createdStory.team}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-[12px] p-4 text-left border-2 border-green-200">
              <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Layers size={12} />
                Sprint
              </p>
              <p className="text-[14px] text-slate-800 font-medium mb-1">{getSprintName()}</p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <BookOpen size={10} />
                {getCourseName()}
              </p>
            </div>

            <div className="bg-slate-50 rounded-[12px] p-4 text-left">
              <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2">Critérios de Aceitação</p>
              <ul className="list-disc pl-4 space-y-1">
                {createdStory.acceptanceCriteria.map((c, i) => (
                  <li key={i} className="text-[13px] text-slate-700">{c}</li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full bg-[#4aa540] text-white py-4 rounded-[16px] text-[16px] font-medium hover:bg-[#3d8935] active:scale-[0.98] transition-all shadow-lg"
          >
            Voltar ao Referencial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 pt-[100px]">
      {/* Header Fixo - Compacto */}
      <div className="fixed top-0 left-0 right-0 bg-[#4aa540] px-6 pt-6 pb-3 rounded-b-[20px] shadow-md z-50">
        <div className="max-w-[390px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={onBack}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="text-white" size={20} />
            </button>
            <h1 className="text-white text-[14px]">Nova User Story</h1>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="text-white animate-spin" size={20} />
              ) : (
                <Save className="text-white" size={20} />
              )}
            </button>
          </div>
          
          {/* Contexto: Curso e Sprint - Compacto */}
          <div className="flex gap-2">
            {(initialCourseName || courses.find(c => c.id === courseId)?.name) && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex-1">
                <p className="text-white/70 text-[9px] uppercase tracking-wide mb-0.5">Curso</p>
                <p className="text-white text-[11px] font-medium truncate">
                  {initialCourseName || courses.find(c => c.id === courseId)?.name}
                </p>
              </div>
            )}
            {(initialSprintName || sprints.find(s => s.id === sprintId)?.name) && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex-1">
                <p className="text-white/70 text-[9px] uppercase tracking-wide mb-0.5">Sprint</p>
                <p className="text-white text-[11px] font-medium truncate">
                  {initialSprintName || sprints.find(s => s.id === sprintId)?.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo principal com espaçamento para o header fixo */}
      <div className="max-w-[390px] mx-auto px-6 py-6 space-y-5">
        {/* Title */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block flex items-center gap-2">
            <FileText size={16} />
            Nome da User Story
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
            placeholder="Digite o nome da user story"
            className={`w-full bg-white border-2 ${
              errors.title && touched.title ? 'border-red-500' : 
              !errors.title && touched.title && title ? 'border-green-500' : 
              'border-slate-200'
            } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors`}
          />
          {errors.title && touched.title && (
            <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {errors.title}
            </p>
          )}
          {!errors.title && touched.title && title && (
            <p className="text-[12px] text-green-600 flex items-center gap-1 mt-1">
              <CheckCircle size={12} />
              Título válido
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
            placeholder="Descreva detalhadamente a user story..."
            rows={4}
            className={`w-full bg-white border-2 ${
              errors.description && touched.description ? 'border-red-500' : 
              !errors.description && touched.description && description ? 'border-green-500' : 
              'border-slate-200'
            } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors resize-none`}
          />
          {errors.description && touched.description && (
            <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {errors.description}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="text-[14px] text-slate-700 mb-3 block">
            Prioridade
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPriority('high')}
              className={`py-3 rounded-[12px] text-[14px] transition-all ${
                priority === 'high'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-white text-slate-700 border-2 border-slate-200'
              }`}
            >
              Alta
            </button>
            <button
              onClick={() => setPriority('medium')}
              className={`py-3 rounded-[12px] text-[14px] transition-all ${
                priority === 'medium'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-slate-700 border-2 border-slate-200'
              }`}
            >
              Média
            </button>
            <button
              onClick={() => setPriority('low')}
              className={`py-3 rounded-[12px] text-[14px] transition-all ${
                priority === 'low'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-slate-700 border-2 border-slate-200'
              }`}
            >
              Baixa
            </button>
          </div>
          <p className="text-[12px] text-slate-500 mt-2">
            ℹ️ Os <strong>Story Points</strong> serão atribuídos pelo formando após análise da equipa
          </p>
        </div>

        {/* Team Selection */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block flex items-center gap-2">
            <UsersIcon size={16} />
            Equipa
          </label>
          <select
            value={team}
            onChange={(e) => {
              const selectedTeamName = e.target.value;
              setTeam(selectedTeamName);
              setTouched(prev => ({ ...prev, team: true }));
              
              if (selectedTeamName !== team) {
                setSprintId('');
                console.log(`[CreateUserStory] 🎯 Equipa mudou para "${selectedTeamName}" - resetando sprintId`);
              }
            }}
            className={`w-full bg-white border-2 ${
              errors.team && touched.team ? 'border-red-500' : 
              team ? 'border-green-500' : 
              'border-slate-200'
            } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors`}
          >
            <option value="">Selecione uma equipa</option>
            {loadingTeams ? (
              <option value="">Carregando...</option>
            ) : teams.length === 0 ? (
              <option value="">Nenhuma equipa disponível</option>
            ) : (
              teams.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))
            )}
          </select>
          {errors.team && touched.team && (
            <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {errors.team}
            </p>
          )}
          {loadingTeams && (
            <p className="text-[12px] text-blue-500 flex items-center gap-1 mt-1">
              <Loader2 size={12} className="animate-spin" />
              Carregando equipas...
            </p>
          )}
          {!loadingTeams && teams.length === 0 && (
            <p className="text-[12px] text-orange-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              Nenhuma equipa encontrada. Crie uma equipa primeiro.
            </p>
          )}
        </div>

        {/* Sprint and Course Info */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block flex items-center gap-2">
            <Layers size={16} />
            Sprint
          </label>
          {initialSprintId ? (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-[12px] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={16} className="text-[#4aa540]" />
                <p className="text-[14px] text-slate-800 font-medium">{getSprintName()}</p>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-slate-500" />
                <p className="text-[12px] text-slate-600">{getCourseName()}</p>
              </div>
            </div>
          ) : (
            <>
              <select
                value={sprintId}
                onChange={(e) => {
                  setSprintId(e.target.value);
                  setTouched(prev => ({ ...prev, sprint: true }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, sprint: true }))}
                className={`w-full bg-white border-2 ${
                  errors.sprint && touched.sprint ? 'border-red-500' :
                  sprintId ? 'border-green-500' : 'border-slate-200'
                } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors`}
                disabled={!team} 
              >
                <option value="">
                  {!team ? 'Selecione primeiro uma equipa' : 'Selecione um sprint'}
                </option>
                {loadingSprints ? (
                  <option value="">Carregando...</option>
                ) : sprints.length === 0 ? (
                  <option value="">Nenhum sprint disponível (crie um primeiro)</option>
                ) : (
                  sprints.map(sprint => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name} {sprint.courseName ? `(${sprint.courseName})` : ''}
                    </option>
                  ))
                )}
              </select>
              {errors.sprint && touched.sprint && (
                <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  {errors.sprint}
                </p>
              )}
            </>
          )}
          {sprintId && courseId && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-[10px] p-3">
              <p className="text-[11px] text-blue-600 uppercase tracking-wide mb-1">Curso Associado</p>
              <p className="text-[13px] text-blue-800 font-medium">{getCourseName()}</p>
            </div>
          )}
          <p className="text-[12px] text-slate-500 mt-2 flex items-center gap-1">
            <AlertCircle size={12} />
            As <strong>User Stories</strong> pertencem aos sprints
          </p>
        </div>

        {/* Acceptance Criteria */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[14px] text-slate-700 flex items-center gap-2">
              Critérios de Aceitação
              <span className="text-red-500 text-[12px]">*</span>
            </label>
            <button
              onClick={addCriteria}
              className="text-[#4aa540] text-[13px] hover:underline"
            >
              + Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {criteria.map((criterion, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={criterion}
                  onChange={(e) => updateCriteria(index, e.target.value)}
                  placeholder={`Critério ${index + 1}`}
                  className="flex-1 bg-white border-2 border-slate-200 rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors"
                />
                {criteria.length > 1 && (
                  <button
                    onClick={() => removeCriteria(index)}
                    className="bg-red-100 text-red-600 p-3 rounded-[12px] hover:bg-red-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {criteria.filter(c => c.trim()).length === 0 && touched.description && (
             <p className="text-[12px] text-red-500 flex items-center gap-1 mt-2">
               <AlertCircle size={12} />
               Pelo menos um critério é obrigatório
             </p>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-[#4aa540] text-white py-4 rounded-[16px] text-[16px] hover:bg-[#3d8935] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Guardando...
            </>
          ) : (
            <>
              <Save size={20} />
              Criar Story
            </>
          )}
        </button>
 
      </div>
    </div>
  );
}
