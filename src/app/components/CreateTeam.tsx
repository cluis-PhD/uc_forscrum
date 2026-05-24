import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Users as UsersIcon,
  Loader2
} from 'lucide-react';
import { toast } from "sonner";
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Interface para os dados da equipa
export interface TeamData {
  name: string;
  courseId?: string;
}

interface CreateTeamProps {
  onBack: () => void;
  onSave?: (team: TeamData) => void;
  existingTeam?: TeamData;
  isEditMode?: boolean;
  courseId?: string; // ID do curso para associar a equipa
}

export function CreateTeam({ onBack, onSave, existingTeam, isEditMode = false, courseId }: CreateTeamProps) {
  console.log('[CreateTeam] PROPS RECEBIDAS:', { courseId, existingTeam, isEditMode });
  
  const [teamName, setTeamName] = useState(existingTeam?.name || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTeam, setCreatedTeam] = useState<TeamData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId || existingTeam?.courseId || '');
  const [loadingCourses, setLoadingCourses] = useState(true);
  
  console.log('[CreateTeam] selectedCourseId inicial:', selectedCourseId);

  // Carregar cursos da base de dados
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

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.courses)) {
          setCourses(data.courses);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      toast.error('Erro ao carregar lista de cursos');
    } finally {
      setLoadingCourses(false);
    }
  };

  // Validação do nome da equipa
  const validateTeamName = (value: string) => {
    if (!value.trim()) return 'Nome da equipa é obrigatório';
    if (value.length < 3) return 'Nome deve ter pelo menos 3 caracteres';
    return undefined;
  };

  const handleTeamNameChange = (value: string) => {
    setTeamName(value);
    if (touched.teamName) {
      const error = validateTeamName(value);
      setErrors(prev => ({ ...prev, teamName: error || '' }));
    }
  };

  // Guardar equipa com alerta de sucesso
  const handleSave = async () => {
    console.log('[CreateTeam handleSave] Iniciando validação...');
    
    // Validações
    const newErrors: Record<string, string> = {};
    
    if (!teamName.trim()) {
      newErrors.teamName = 'Nome da equipa é obrigatório';
    }
    
    // VALIDAÇÃO CRÍTICA: courseId é obrigatório
    if (!selectedCourseId || selectedCourseId.trim() === '') {
      console.error('[CreateTeam handleSave] ⚠️ ERRO: selectedCourseId está vazio!');
      toast.error('Erro: Curso não selecionado. Por favor, volte e tente novamente.');
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Object.keys(newErrors).forEach(key => {
        setTouched(prev => ({ ...prev, [key]: true }));
      });
      return;
    }

    // Criar objeto da equipa
    const teamData: TeamData = {
      name: teamName,
      courseId: selectedCourseId,
    };

    console.log('[CreateTeam handleSave] Enviando para backend:', teamData);

    // Salvar no backend
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(teamData),
        }
      );

      console.log('[CreateTeam handleSave] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao criar equipa');
      }

      const data = await response.json();
      
      // Guardar e mostrar alerta de sucesso
      setCreatedTeam(teamData);
      setShowSuccess(true);
      onSave?.(teamData);
      
      // Voltar automaticamente após 2 segundos
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Erro ao criar equipa:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar equipa');
    } finally {
      setIsSaving(false);
    }
  };

  // Alerta de sucesso
  if (showSuccess && createdTeam) {
    return (
      <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] flex items-center justify-center p-6">
        <div className="max-w-[390px] w-full bg-white rounded-[24px] p-8 shadow-2xl text-center animate-in fade-in zoom-in duration-300">
          {/* Ícone de sucesso animado */}
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="text-white" size={48} strokeWidth={2.5} />
          </div>

          {/* Título */}
          <h2 className="text-[24px] text-slate-800 mb-2">
            {isEditMode ? 'Equipa Atualizada!' : 'Equipa Criada!'}
          </h2>
          <p className="text-[14px] text-slate-600 mb-6">
            {isEditMode 
              ? 'A equipa foi atualizada com sucesso'
              : 'A nova equipa foi criada com sucesso'
            }
          </p>

          {/* Detalhes da equipa */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-[16px] p-4 mb-6 border-2 border-green-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-600">Nome:</span>
                <span className="text-[15px] text-slate-800 font-medium">{createdTeam.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-600">Curso:</span>
                <span className="text-[15px] text-slate-800 font-medium">
                  {courses.find(c => c.id === createdTeam.courseId)?.name || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Botão OK */}
          <button
            onClick={onBack}
            className="w-full bg-[#4aa540] text-white py-4 rounded-[16px] text-[16px] hover:bg-[#3d8935] active:scale-[0.98] transition-all shadow-lg"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif]">
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
            <h1 className="text-white text-[20px]">{isEditMode ? 'Editar Equipa' : 'Nova Equipa'}</h1>
            <button 
              onClick={handleSave}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <Save className="text-white" size={24} />
            </button> 

          
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-[390px] mx-auto px-6 py-6 space-y-5">
        {/* Team Name */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block flex items-center gap-2">
            <UsersIcon size={16} />
            Nome da Equipa
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => handleTeamNameChange(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, teamName: true }))}
            placeholder="Ex: Equipa Alpha"
            className={`w-full bg-white border-2 ${
              errors.teamName && touched.teamName ? 'border-red-500' : 
              !errors.teamName && touched.teamName && teamName ? 'border-green-500' : 
              'border-slate-200'
            } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors`}
          />
          {errors.teamName && touched.teamName && (
            <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {errors.teamName}
            </p>
          )}
          {!errors.teamName && touched.teamName && teamName && (
            <p className="text-[12px] text-green-600 flex items-center gap-1 mt-1">
              <CheckCircle size={12} />
              Nome válido
            </p>
          )}
        </div>

        {/* Course Selection */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block flex items-center gap-2">
            <UsersIcon size={16} />
            Curso
          </label>
          {loadingCourses ? (
            <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-[10px] px-3 py-2 text-[13px] text-slate-500">
              A carregar cursos...
            </div>
          ) : courses.length === 0 ? (
            <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-[10px] px-3 py-2 text-[13px] text-slate-500">
              Nenhum curso disponível. Crie cursos primeiro.
            </div>
          ) : (
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-[10px] px-3 py-2 text-[13px] focus:outline-none focus:border-[#4aa540] transition-colors"
            >
              <option value="">Selecione um curso</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          )}
          {errors.courseId && touched.courseId && (
            <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {errors.courseId}
            </p>
          )}
        </div>

        {/* Summary Card */}
        {teamName && selectedCourseId && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-[16px] p-4 border-2 border-green-200">
            <h3 className="text-[14px] text-slate-800 mb-2">Resumo da Equipa</h3>
            <div className="space-y-1 text-[13px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Nome:</span>
                <span className="text-slate-800">{teamName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Curso:</span>
                <span className="text-slate-800">
                  {courses.find(c => c.id === selectedCourseId)?.name || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Save Button - espaçamento adequado */}
        <button
          onClick={handleSave}
          className="w-full bg-[#4aa540] text-white py-4 rounded-[16px] text-[16px] hover:bg-[#3d8935] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {isEditMode ? 'Guardar Alterações' : 'Criar Equipa'}
        </button>

        {/* Espaçamento extra para acessibilidade e usabilidade */}
        <div className="pb-32" />
      </div>
    </div>
  );
}
