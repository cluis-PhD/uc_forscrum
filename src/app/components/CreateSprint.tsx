import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Save,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Loader2,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CreateSprintProps {
  onBack: () => void;
  onSave?: () => void;
  courseId?: string;
  courseName?: string;
}

export interface SprintData {
  id?: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  courseId: string;
  teamId?: string;
  createdAt?: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface Team {
  id: string;
  name: string;
  courseId: string;
}

export function CreateSprint({ onBack, onSave, courseId: initialCourseId, courseName: initialCourseName }: CreateSprintProps) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [courseId, setCourseId] = useState(initialCourseId || '');
  const [teamId, setTeamId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSprint, setCreatedSprint] = useState<SprintData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para carregar cursos
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  
  // Estados para carregar equipas
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Carregar cursos do Supabase
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
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
        throw new Error('Erro ao carregar cursos');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.courses)) {
        setCourses(data.courses);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Erro ao carregar lista de cursos');
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Carregar equipas quando o curso é selecionado
  useEffect(() => {
    if (courseId) {
      loadTeams(courseId);
    } else {
      setTeams([]);
      setTeamId('');
    }
  }, [courseId]);

  const loadTeams = async (courseId: string) => {
    try {
      setLoadingTeams(true);
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

      if (!response.ok) {
        throw new Error('Erro ao carregar equipas');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.teams)) {
        // SEMPRE FILTRAR NO FRONTEND TAMBÉM (dupla segurança)
        const filteredTeams = data.teams.filter((t: any) => t.courseId === courseId);
        
        console.log(`[CreateSprint] ✓ EQUIPAS FILTRADAS:`);
        console.log(`[CreateSprint]   - Total recebido do backend: ${data.teams.length}`);
        console.log(`[CreateSprint]   - Total após filtrar por courseId="${courseId}": ${filteredTeams.length}`);
        console.log('[CreateSprint]   - Equipas filtradas:', filteredTeams.map((t: any) => ({ name: t.name, courseId: t.courseId })));
        
        setTeams(filteredTeams);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Erro ao carregar lista de equipas');
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  // Encontrar nome do curso selecionado
  const getCourseName = () => {
    if (initialCourseName) return initialCourseName;
    const course = courses.find(c => c.id === courseId);
    return course?.name || '';
  };

  const validateName = (value: string) => {
    if (!value.trim()) return 'Nome é obrigatório';
    if (value.length < 5) return 'Nome deve ter pelo menos 5 caracteres';
    return undefined;
  };

  const validateGoal = (value: string) => {
    if (!value.trim()) return 'Objetivo é obrigatório';
    return undefined;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (touched.name) {
      const error = validateName(value);
      setErrors(prev => ({ ...prev, name: error || '' }));
    }
  };

  const handleGoalChange = (value: string) => {
    setGoal(value);
    if (touched.goal) {
      const error = validateGoal(value);
      setErrors(prev => ({ ...prev, goal: error || '' }));
    }
  };

  const handleSave = async () => {
    setTouched({ name: true, goal: true, startDate: true, endDate: true, courseId: true, teamId: true });

    const nameError = validateName(name);
    const goalError = validateGoal(goal);
    const startDateError = !startDate ? 'Data de início é obrigatória' : undefined;
    const endDateError = !endDate ? 'Data de fim é obrigatória' : undefined;
    const courseIdError = !courseId ? 'Selecione uma turma' : undefined;
    const teamIdError = !teamId ? 'Selecione uma equipa' : undefined;

    // Validar se data fim é depois de data início
    let dateRangeError: string | undefined = undefined;
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      dateRangeError = 'Data de fim não pode ser anterior à data de início';
    }

    setErrors({
      name: nameError || '',
      goal: goalError || '',
      startDate: startDateError || '',
      endDate: endDateError || dateRangeError || '',
      courseId: courseIdError || '',
      teamId: teamIdError || '',
    });

    if (nameError || goalError || startDateError || endDateError || dateRangeError || courseIdError || teamIdError) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    const sprintData: SprintData = {
      name,
      goal,
      startDate,
      endDate,
      courseId,
      teamId,
    };

    // Save to Supabase
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/sprints`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(sprintData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sprint');
      }

      setCreatedSprint(data.sprint);
      setShowSuccess(true);
      onSave?.();
    } catch (error) {
      console.error('Error creating sprint:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar sprint');
    } finally {
      setIsSaving(false);
    }
  };

  // Se o sprint foi criado, mostrar card de sucesso
  if (showSuccess && createdSprint) {
    const calculateDuration = () => {
      const start = new Date(createdSprint.startDate);
      const end = new Date(createdSprint.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    return (
      <div className="bg-[#f0f0f0] min-h-screen h-full w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 overflow-auto">
        {/* Header */}
        <div className="bg-[#4aa540] px-6 pt-12 pb-6 rounded-b-[24px] shadow-lg">
          <div className="max-w-[390px] mx-auto">
            <div className="flex items-center justify-between">
              <button 
                onClick={onBack}
                className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="text-white" size={24} />
              </button>
              <h1 className="text-white text-[20px]">Sprint Criado</h1>
              <div className="w-10" />
            </div>
          </div>
        </div>

        {/* Success Card */}
        <div className="w-full max-w-md mx-auto px-6 py-6">
          <div className="bg-white rounded-[20px] p-6 shadow-lg border-2 border-green-200">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={40} className="text-green-600" />
              </div>
            </div>
            
            <h2 className="text-[22px] text-center text-slate-800 mb-2">Sprint Criado!</h2>
            <p className="text-[14px] text-center text-slate-500 mb-6">
              O sprint foi criado com sucesso e está pronto para iniciar.
            </p>

            <div className="bg-slate-50 rounded-[16px] p-4 space-y-3 mb-6">
              <div>
                <p className="text-[12px] text-slate-500 mb-1">Nome do Sprint</p>
                <p className="text-[16px] text-slate-800 font-medium">{createdSprint.name}</p>
              </div>
              
              <div>
                <p className="text-[12px] text-slate-500 mb-1">Objetivo</p>
                <p className="text-[14px] text-slate-700">{createdSprint.goal}</p>
              </div>
              
              <div>
                <p className="text-[12px] text-slate-500 mb-1">Turma</p>
                <p className="text-[14px] text-slate-800">{getCourseName()}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="text-[12px] text-slate-500 mb-1">Data de Início</p>
                  <p className="text-[14px] text-slate-800">
                    {new Date(createdSprint.startDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-slate-500 mb-1">Data de Fim</p>
                  <p className="text-[14px] text-slate-800">
                    {new Date(createdSprint.endDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <p className="text-[12px] text-slate-500 mb-1">Duração</p>
                <p className="text-[16px] text-[#4aa540] font-semibold">{calculateDuration()} dias</p>
              </div>
            </div>

            <button
              onClick={onBack}
              className="w-full bg-[#4aa540] text-white py-4 rounded-[14px] text-[16px] hover:bg-[#3d8935] active:scale-[0.98] transition-all shadow-lg"
            >
              Voltar para Sprints
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f0f0] min-h-screen h-full w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] overflow-auto">
      {/* Header com contexto do curso */}
      <div className="bg-[#4aa540] px-6 pt-12 pb-6 rounded-b-[24px] shadow-lg">
        <div className="max-w-[390px] mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={onBack}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="text-white" size={24} />
            </button>
            <h1 className="text-white text-[20px]">Criar Sprint</h1>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="text-white animate-spin" size={24} />
              ) : (
                <Save className="text-white" size={24} />
              )}
            </button>
          </div>
          {/* Nome do curso */}
          {(initialCourseName || courses.find(c => c.id === courseId)?.name) && (
            <div className="bg-white/10 backdrop-blur-sm rounded-[12px] px-4 py-2">
              <p className="text-white/70 text-[11px] uppercase tracking-wide mb-0.5">Curso</p>
              <p className="text-white text-[14px] font-medium">
                {initialCourseName || courses.find(c => c.id === courseId)?.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="w-full max-w-md mx-auto px-6 py-6 space-y-5 pb-32">
        {/* Sprint Name */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block flex items-center gap-2">
            <Target size={16} />
            Nome do Sprint
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
            placeholder="Ex: Sprint 1 - Autenticação"
            className={`w-full bg-white border-2 ${
              errors.name && touched.name ? 'border-red-500' : 
              !errors.name && touched.name && name ? 'border-green-500' : 
              'border-slate-200'
            } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors`}
          />
          {errors.name && touched.name && (
            <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {errors.name}
            </p>
          )}
          {!errors.name && touched.name && name && (
            <p className="text-[12px] text-green-600 flex items-center gap-1 mt-1">
              <CheckCircle size={12} />
              Nome válido
            </p>
          )}
        </div>

        {/* Sprint Goal */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block">
            Objetivo do Sprint (Sprint Goal)
          </label>
          <textarea
            value={goal}
            onChange={(e) => handleGoalChange(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, goal: true }))}
            placeholder="Descreva o objetivo principal deste sprint..."
            rows={4}
            className={`w-full bg-white border-2 ${
              errors.goal && touched.goal ? 'border-red-500' : 
              !errors.goal && touched.goal && goal ? 'border-green-500' : 
              'border-slate-200'
            } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors resize-none`}
          />
          {errors.goal && touched.goal && (
            <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {errors.goal}
            </p>
          )}
        </div>

        {/* Turma Selection */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block">
            Turma / Curso
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={`w-full bg-slate-50 border-2 ${
              errors.courseId && touched.courseId ? 'border-red-500' : 
              courseId ? 'border-green-500' : 
              'border-slate-200'
            } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors`}
          >
            <option value="">Selecione uma turma</option>
            {loadingCourses ? (
              <option value="">Carregando...</option>
            ) : (
              courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))
            )}
          </select>
          {errors.courseId && touched.courseId && (
            <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {errors.courseId}
            </p>
          )}
        </div>

        {/* Equipa Selection - Apenas aparece se curso estiver selecionado */}
        {courseId && (
          <div>
            <label className="text-[14px] text-slate-700 mb-2 block">
              Equipa <span className="text-red-500">*</span>
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              disabled={loadingTeams}
              className={`w-full bg-slate-50 border-2 ${
                errors.teamId && touched.teamId ? 'border-red-500' : 
                teamId ? 'border-green-500' : 
                'border-slate-200'
              } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors disabled:opacity-50`}
            >
              <option value="">Selecione uma equipa</option>
              {loadingTeams ? (
                <option value="">Carregando equipas...</option>
              ) : teams.length === 0 ? (
                <option value="">Nenhuma equipa disponível - Crie uma equipa primeiro</option>
              ) : (
                teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))
              )}
            </select>
            {errors.teamId && touched.teamId && (
              <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle size={12} />
                {errors.teamId}
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              ⚠️ Sprints devem estar associados a uma equipa específica
            </p>
          </div>
        )}

        {/* Start Date */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block flex items-center gap-2">
            <Calendar size={16} />
            Data de Início
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setTouched(prev => ({ ...prev, startDate: true }));
            }}
            className={`w-full bg-white border-2 ${
              errors.startDate && touched.startDate ? 'border-red-500' : 
              startDate ? 'border-green-500' : 
              'border-slate-200'
            } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors`}
          />
          {errors.startDate && touched.startDate && (
            <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {errors.startDate}
            </p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block flex items-center gap-2">
            <Calendar size={16} />
            Data de Fim
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setTouched(prev => ({ ...prev, endDate: true }));
            }}
            className={`w-full bg-white border-2 ${
              errors.endDate && touched.endDate ? 'border-red-500' : 
              endDate ? 'border-green-500' : 
              'border-slate-200'
            } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors`}
          />
          {errors.endDate && touched.endDate && (
            <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {errors.endDate}
            </p>
          )}
        </div>

        {/* Summary Card */}
        {name && goal && startDate && endDate && courseId && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-[16px] p-4 border-2 border-green-200">
            <h3 className="text-[14px] text-slate-800 mb-3">Resumo do Sprint</h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Nome:</span>
                <span className="text-slate-800">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Turma:</span>
                <span className="text-slate-800">{getCourseName()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Período:</span>
                <span className="text-slate-800">
                  {new Date(startDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} - {new Date(endDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-[#4aa540] text-white py-4 rounded-[16px] text-[16px] hover:bg-[#3d8935] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={20} />
              Criar Sprint
            </>
          )}
        </button>
      </div>
    </div>
  );
}