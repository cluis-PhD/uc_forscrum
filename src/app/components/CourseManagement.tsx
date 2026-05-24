import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Plus,
  BookOpen,
  Users,
  Layers,
  FileText,
  Trash2,
  Target,
  CheckCircle,
  Mail,
  Calendar,
  Loader2,
  AlertCircle,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from './shared/Header';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CourseManagementProps {
  onBack: () => void;
  onNavigate?: (screen: string, courseId?: string) => void;
}

interface CreateCourseProps {
  onBack: () => void;
  onSave?: () => void;
}

export function CreateCourse({ onBack, onSave }: CreateCourseProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validateName = (value: string) => {
    if (!value.trim()) return 'Nome é obrigatório';
    if (value.length < 3) return 'Nome deve ter pelo menos 3 caracteres';
    return undefined;
  };

  const validateDescription = (value: string) => {
    if (!value.trim()) return 'Descrição é obrigatória';
    if (value.length < 10) return 'Descrição deve ter pelo menos 10 caracteres';
    return undefined;
  };

  const validateStartDate = (value: string) => {
    if (!value) return 'Data de início é obrigatória';
    return undefined;
  };

  const validateEndDate = (value: string, startDateValue: string) => {
    if (!value) return 'Data de fim é obrigatória';
    if (startDateValue && new Date(value) < new Date(startDateValue)) {
      return 'Data de fim não pode ser anterior à data de início';
    }
    return undefined;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    
    let error: string | undefined;
    switch (field) {
      case 'name':
        error = validateName(name);
        break;
      case 'description':
        error = validateDescription(description);
        break;
      case 'startDate':
        error = validateStartDate(startDate);
        break;
      case 'endDate':
        error = validateEndDate(endDate, startDate);
        break;
    }
    
    setErrors({ ...errors, [field]: error || '' });
  };

  const handleSave = async () => {
    // Validate all fields
    const nameError = validateName(name);
    const descriptionError = validateDescription(description);
    const startDateError = validateStartDate(startDate);
    const endDateError = validateEndDate(endDate, startDate);

    const newErrors = {
      name: nameError || '',
      description: descriptionError || '',
      startDate: startDateError || '',
      endDate: endDateError || '',
    };

    setErrors(newErrors);
    setTouched({
      name: true,
      description: true,
      startDate: true,
      endDate: true,
    });

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== '')) {
      toast.error('Por favor, corrija os erros antes de salvar');
      return;
    }

    // Save course
    setIsSaving(true);
    try {
      // Converter datas do formato YYYY-MM-DD para DD/MM/YY
      const formatDateToPT = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year.slice(-2)}`;
      };

      const courseData = {
        name,
        description,
        startDate: formatDateToPT(startDate),
        endDate: formatDateToPT(endDate),
      };

      console.log('[CreateCourse] 📤 Dados a enviar:', courseData);
      console.log('[CreateCourse] startDate original:', startDate);
      console.log('[CreateCourse] endDate original:', endDate);
      console.log('[CreateCourse] startDate formatado:', courseData.startDate);
      console.log('[CreateCourse] endDate formatado:', courseData.endDate);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/courses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(courseData),
        }
      );

      const data = await response.json();

      console.log('[CreateCourse] 📥 Resposta do backend:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar curso');
      }

      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        if (onSave) {
          onSave();
        } else {
          onBack();
        }
      }, 2000);
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar curso');
    } finally {
      setIsSaving(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="bg-[#f0f0f0] min-h-screen h-full w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] flex items-center justify-center p-6">
        <div className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-xl text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h2 className="text-[24px] text-slate-800 mb-3">Curso Criado!</h2>
          <p className="text-[15px] text-slate-600 mb-4">
            O curso <span className="font-medium text-[#4aa540]">{name}</span> foi criado com sucesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f0f0] min-h-screen h-full w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] overflow-auto">
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
            <h1 className="text-white text-[20px]">Criar Curso</h1>
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
        </div>
      </div>

      {/* Form */}
      <div className="w-full max-w-md mx-auto px-6 py-6 space-y-5 pb-32">
        {/* Course Name */}
        <div>
          <label className="block text-[14px] text-slate-700 mb-2 font-medium">
            Nome do Curso *
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Ex: Product Owner Avançado"
              className={`w-full px-4 py-3.5 rounded-[12px] border-2 transition-all text-[15px] ${
                touched.name && errors.name
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-slate-200 bg-white focus:border-[#4aa540] focus:ring-2 focus:ring-green-100'
              }`}
            />
            {touched.name && errors.name && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <AlertCircle className="text-red-500" size={20} />
              </div>
            )}
          </div>
          {touched.name && errors.name && (
            <p className="mt-2 text-[13px] text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-[14px] text-slate-700 mb-2 font-medium">
            Descrição *
          </label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleBlur('description')}
              placeholder="Descreva o curso e seus objetivos..."
              rows={4}
              className={`w-full px-4 py-3.5 rounded-[12px] border-2 transition-all text-[15px] resize-none ${
                touched.description && errors.description
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-slate-200 bg-white focus:border-[#4aa540] focus:ring-2 focus:ring-green-100'
              }`}
            />
          </div>
          {touched.description && errors.description && (
            <p className="mt-2 text-[13px] text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.description}
            </p>
          )}
        </div>

        {/* Start Date - Full Width */}
        <div>
          <label className="block text-[14px] text-slate-700 mb-2 font-medium">
            Data de Início *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onBlur={() => handleBlur('startDate')}
              className={`w-full pl-10 pr-4 py-3.5 rounded-[12px] border-2 transition-all text-[15px] ${
                touched.startDate && errors.startDate
                  ? 'border-red-300 bg-red-50 focus:border-red-500'
                  : 'border-slate-200 bg-white focus:border-[#4aa540]'
              }`}
            />
          </div>
          {touched.startDate && errors.startDate && (
            <p className="mt-2 text-[13px] text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.startDate}
            </p>
          )}
        </div>

        {/* End Date - Full Width */}
        <div>
          <label className="block text-[14px] text-slate-700 mb-2 font-medium">
            Data de Fim *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onBlur={() => handleBlur('endDate')}
              className={`w-full pl-10 pr-4 py-3.5 rounded-[12px] border-2 transition-all text-[15px] ${
                touched.endDate && errors.endDate
                  ? 'border-red-300 bg-red-50 focus:border-red-500'
                  : 'border-slate-200 bg-white focus:border-[#4aa540]'
              }`}
            />
          </div>
          {touched.endDate && errors.endDate && (
            <p className="mt-2 text-[13px] text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.endDate}
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#4aa540] text-white py-4 rounded-[14px] text-[16px] font-medium hover:bg-[#3d8935] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Criando...
              </>
            ) : (
              <>
                <BookOpen size={20} />
                Criar Curso
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Interface para definir a estrutura de um curso
interface Course {
  id: string;
  name: string;
  description: string;
  students: number;
  teams: number;
  sprints: number;
  userStories: number;
  status: 'active' | 'new' | 'completed';
  startDate: string;
  endDate: string;
  progress: number;
  studentsList?: string[];
  createdAt: string;
}

export function CourseManagement({ onBack, onNavigate }: CourseManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  
  // Estados para contar entidades relacionadas
  const [students, setStudents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  // URL base da API
  const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-1184b871`;

  // Carregar cursos ao montar o componente
  useEffect(() => {
    loadAllData();
    
    // Sistema de reload automático a cada 30 segundos (melhor para UX)
    const interval = setInterval(() => {
      console.log('[CourseManagement] 🔄 Auto-reload - A recarregar dados...');
      loadAllData();
    }, 30000); // 30 segundos
    
    return () => {
      console.log('[CourseManagement] 🛑 Limpando polling automático');
      clearInterval(interval);
    };
  }, []);

  // Função para carregar todos os dados necessários
  const loadAllData = async () => {
    await Promise.all([
      loadCourses(),
      loadStudents(),
      loadTeams(),
      loadSprints(),
      loadStories()
    ]);
  };

  // Função para carregar cursos do Supabase
  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar cursos: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.courses)) {
        console.log('[CourseManagement] Cursos recebidos do backend:', data.courses);
        setCourses(data.courses);
        console.log(`${data.courses.length} cursos carregados com sucesso`);
      } else {
        console.error('Formato de resposta inválido:', data);
        setCourses([]);
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      toast.error('Erro ao carregar cursos. Tente novamente.');
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Carregar formandos
  const loadStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.students)) {
          setStudents(data.students);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar formandos:', error);
    }
  };

  // Carregar equipas
  const loadTeams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.teams)) {
          setTeams(data.teams);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar equipas:', error);
    }
  };

  // Carregar sprints
  const loadSprints = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sprints`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.sprints)) {
          setSprints(data.sprints);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sprints:', error);
    }
  };

  // Carregar user stories
  const loadStories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.stories)) {
          setStories(data.stories);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar user stories:', error);
    }
  };

  // Funções para contar entidades por curso
  const getStudentCount = (courseId: string) => {
    return students.filter(s => s.courseId === courseId).length;
  };

  const getTeamCount = (courseId: string) => {
    return teams.filter(t => t.courseId === courseId).length;
  };

  const getSprintCount = (courseId: string) => {
    return sprints.filter(s => s.courseId === courseId).length;
  };

  const getStoryCount = (courseId: string) => {
    return stories.filter(s => s.courseId === courseId).length;
  };

  // Função para formatar data de forma segura
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString || dateString.trim() === '') {
      return '--/--/--';
    }

    // Se a data já vem formatada (formato dd/mm/yyyy), converter ano para 2 dígitos
    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (datePattern.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${day}/${month}/${year.slice(-2)}`;
    }

    // Formato dd/mm/yy (já com 2 dígitos)
    const datePatternShort = /^\d{2}\/\d{2}\/\d{2}$/;
    if (datePatternShort.test(dateString)) {
      return dateString; // Já está no formato correto
    }

    // Caso contrário, tentar fazer parse e formatar
    try {
      const date = new Date(dateString);

      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return '--/--/--';
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);

      return `${day}/${month}/${year}`;
    } catch (error) {
      return '--/--/--';
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
   
  // Função para arquivar curso no Supabase
  const handleArchiveCourse = async (courseId: string, courseName: string) => {
    if (!confirm(`Tem certeza que deseja eliminar o curso "${courseName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao eliminar curso: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Remover curso da lista local
        setCourses(courses.filter(course => course.id !== courseId));
        toast.success('Curso eliminado com sucesso!');
        console.log('Curso eliminado:', courseId);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao eliminar curso:', error);
      toast.error(`Erro ao eliminar curso: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'new':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'new':
        return 'Novo';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };
  // Se showCreateCourse é true, mostrar o componente CreateCourse
  if (showCreateCourse) {
    return (
      <CreateCourse 
        onBack={() => setShowCreateCourse(false)}
        onSave={() => {
          setShowCreateCourse(false);
          loadAllData(); // Recarregar todos os dados
        }}
      />
    );
  }

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 pt-[100px]">
      {/* Header */}
      <Header
        title="Gerir Cursos"
        onBack={onBack}
        showProfile={false}
      />

      {/* Content */}
      <div className="w-full max-w-md mx-auto px-6 py-8 space-y-4">
        {/* Criar Curso Button */}
        <button
          onClick={() => setShowCreateCourse(true)}
          className="w-full bg-white text-[#4aa540] border-2 border-[#4aa540] rounded-[14px] p-4 shadow-sm hover:shadow-md hover:bg-[#4aa540] hover:text-white transition-all flex items-center justify-center gap-2 group"
        >
          <Plus size={22} strokeWidth={2.5} className="text-[#4aa540] group-hover:text-white transition-colors" />
          <span className="text-[16px] font-medium">Criar Novo Curso</span>
        </button>

        {/* Loading State */}
        {loadingCourses && (
          <div className="text-center py-12">
            <Loader2 className="inline-block animate-spin text-[#4aa540] h-12 w-12 mb-3" />
            <p className="text-slate-500 mt-4">A carregar cursos...</p>
          </div>
        )}

        {/* Courses List */}
        {!loadingCourses && (
          <div>
            <p className="text-[14px] text-slate-500 mb-3">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'}
            </p>

            <div className="space-y-3">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => onNavigate?.('courseDetails', { courseId: course.id, courseName: course.name })}
                  className="bg-white rounded-[16px] p-4 shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-[#4aa540] cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[17px] text-slate-800">{course.name}</h3>
                        <span className={`${getStatusColor(course.status)} px-2 py-1 rounded-[6px] text-[11px]`}>
                          {getStatusLabel(course.status)}
                        </span>
                      </div>
                      <p className="text-[14px] text-slate-500 mb-2">{course.description}</p>
                      <p className="text-[12px] text-slate-400">
                        {formatDate(course.startDate)}
                      </p>
                    </div>
                  </div>

                  {/* Stats - Vertical Layout */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-3 bg-blue-50 rounded-[10px] p-3 border border-blue-100">
                      <div className="bg-blue-100 p-2 rounded-[8px]">
                        <Users size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] text-slate-500">Formandos</p>
                        <p className="text-[18px] text-slate-800 font-semibold">{getStudentCount(course.id)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-purple-50 rounded-[10px] p-3 border border-purple-100">
                      <div className="bg-purple-100 p-2 rounded-[8px]">
                        <Target size={18} className="text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] text-slate-500">Equipas</p>
                        <p className="text-[18px] text-slate-800 font-semibold">{getTeamCount(course.id)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-orange-50 rounded-[10px] p-3 border border-orange-100">
                      <div className="bg-orange-100 p-2 rounded-[8px]">
                        <Layers size={18} className="text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] text-slate-500">Sprints</p>
                        <p className="text-[18px] text-slate-800 font-semibold">{getSprintCount(course.id)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-green-50 rounded-[10px] p-3 border border-green-100">
                      <div className="bg-green-100 p-2 rounded-[8px]">
                        <FileText size={18} className="text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] text-slate-500">User Stories</p>
                        <p className="text-[18px] text-slate-800 font-semibold">{getStoryCount(course.id)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[12px] text-slate-500">Progresso</p>
                      <p className="text-[13px] text-slate-800">{course.progress}%</p>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className="bg-[#4aa540] h-1.5 rounded-full transition-all" 
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveCourse(course.id, course.name);
                      }}
                      className="flex-1 py-2.5 px-3 border-2 border-slate-200 text-slate-700 rounded-[10px] text-[14px] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {filteredCourses.length === 0 && !loadingCourses && (
                <div className="text-center py-12">
                  <BookOpen size={48} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-[15px]">Nenhum curso encontrado</p>
                  <p className="text-slate-400 text-[13px] mt-1">Crie o seu primeiro curso!</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  );
}
