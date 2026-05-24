import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Loader2,
  Users as UsersIcon,
  BookOpen
} from 'lucide-react';
import { toast } from "sonner";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CreateStudentProps {
  onBack: () => void;
  onSave?: (student: any) => void;
  courseId?: string;
  courseName?: string;
}

export function CreateStudent({ onBack, onSave, courseId: initialCourseId, courseName: initialCourseName }: CreateStudentProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [courseId, setCourseId] = useState(initialCourseId || '');
  const [teamId, setTeamId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Estados para carregar cursos e equipas
  const [courses, setCourses] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Carregar cursos e equipas
  useEffect(() => {
    loadCourses();
    loadTeams();
  }, []);

  // Recarregar equipas quando o curso muda
  useEffect(() => {
    if (courseId) {
      loadTeams();
    }
  }, [courseId]);

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
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      // Filtrar equipas por courseId se fornecido
      const teamsUrl = courseId
        ? `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams?courseId=${courseId}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams`;
      
      const response = await fetch(teamsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.teams)) {
          // SEMPRE FILTRAR NO FRONTEND TAMBÉM (dupla segurança)
          const filteredTeams = courseId 
            ? data.teams.filter((t: any) => t.courseId === courseId)
            : data.teams;
          
          console.log(`[CreateStudent] ✓ EQUIPAS FILTRADAS:`);
          console.log(`[CreateStudent]   - Total recebido do backend: ${data.teams.length}`);
          console.log(`[CreateStudent]   - Total após filtrar por courseId="${courseId}": ${filteredTeams.length}`);
          console.log('[CreateStudent]   - Equipas filtradas:', filteredTeams.map((t: any) => ({ name: t.name, courseId: t.courseId })));
          
          setTeams(filteredTeams);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar equipas:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  // Validação do nome
  const validateName = (value: string) => {
    if (!value.trim()) return 'Nome é obrigatório';
    if (value.length < 3) return 'Nome deve ter pelo menos 3 caracteres';
    return undefined;
  };

  // Validação de email
  const validateEmail = (value: string) => {
    // Email é opcional agora
    if (!value.trim()) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Email inválido';
    return undefined;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (touched.name) {
      const error = validateName(value);
      setErrors(prev => ({ ...prev, name: error || '' }));
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      const error = validateEmail(value);
      setErrors(prev => ({ ...prev, email: error || '' }));
    }
  };

  const handleSave = async () => {
    setTouched({ name: true, email: true, course: true });

    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const courseError = !courseId ? 'Selecione um curso' : undefined;

    setErrors({
      name: nameError || '',
      email: emailError || '',
      course: courseError || '',
    });

    // Só bloqueia se houver erro de nome ou curso (email é opcional)
    if (nameError || courseError) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    // Se o email tiver conteúdo mas for inválido, bloquear
    if (email.trim() && emailError) {
      toast.error('Por favor, insira um email válido ou deixe em branco');
      return;
    }

    setIsSaving(true);
    try {
      const studentData = {
        name,
        email,
        courseId,
        teamId: teamId || '',
      };

      console.log('Criando formando:', studentData);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/students`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studentData),
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro do servidor:', errorData);
        throw new Error(errorData.error || 'Erro ao criar formando');
      }

      const data = await response.json();
      console.log('Formando criado:', data);
      
      setShowSuccess(true);
      onSave?.(data.student);
      
      // Voltar automaticamente após 2 segundos
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Erro ao criar formando:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar formando');
    } finally {
      setIsSaving(false);
    }
  };

  const getCourseName = () => {
    if (initialCourseName) return initialCourseName;
    const course = courses.find(c => c.id === courseId);
    return course?.name || '';
  };

  const getTeamName = () => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || '';
  };

  if (showSuccess) {
    return (
      <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] flex items-center justify-center p-6">
        <div className="max-w-[390px] w-full bg-white rounded-[24px] p-8 shadow-2xl text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="text-white" size={48} strokeWidth={2.5} />
          </div>

          <h2 className="text-[24px] text-slate-800 mb-2">Formando Criado!</h2>
          <p className="text-[14px] text-slate-600 mb-6">O formando foi adicionado com sucesso</p>

          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-[16px] p-4 mb-6 border-2 border-green-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-600">Nome:</span>
                <span className="text-[15px] text-slate-800 font-medium">{name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-600">Email:</span>
                <span className="text-[15px] text-slate-800 font-medium">{email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-600">Curso:</span>
                <span className="text-[15px] text-slate-800 font-medium">{getCourseName()}</span>
              </div>
              {teamId && (
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-600">Equipa:</span>
                  <span className="text-[15px] text-slate-800 font-medium">{getTeamName()}</span>
                </div>
              )}
            </div>
          </div>

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
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24">
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
            <h1 className="text-white text-[20px]">Novo Formando</h1>
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
      <div className="max-w-[390px] mx-auto px-6 py-6 space-y-5">
        {/* Name */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block flex items-center gap-2">
            <User size={16} />
            Nome do Formando
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
            placeholder="Nome completo"
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

        {/* Email */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block flex items-center gap-2">
            <Mail size={16} />
            Email (Opcional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
            placeholder="email@exemplo.com"
            className={`w-full bg-white border-2 ${
              errors.email && touched.email ? 'border-red-500' : 
              !errors.email && touched.email && email ? 'border-green-500' : 
              'border-slate-200'
            } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors`}
          />
          {errors.email && touched.email && (
            <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {errors.email}
            </p>
          )}
          <p className="text-[12px] text-slate-500 mt-2">
            O email é opcional. Pode ser adicionado mais tarde.
          </p>
        </div>

        {/* Course Selection */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block flex items-center gap-2">
            <BookOpen size={16} />
            Curso
          </label>
          {initialCourseId ? (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-[12px] p-4">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[#4aa540]" />
                <p className="text-[14px] text-slate-800 font-medium">{getCourseName()}</p>
              </div>
            </div>
          ) : (
            <>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setTouched(prev => ({ ...prev, course: true }));
                }}
                className={`w-full bg-white border-2 ${
                  errors.course && touched.course ? 'border-red-500' :
                  courseId ? 'border-green-500' : 'border-slate-200'
                } rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors`}
              >
                <option value="">Selecione um curso</option>
                {loadingCourses ? (
                  <option value="">Carregando...</option>
                ) : (
                  courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))
                )}
              </select>
              {errors.course && touched.course && (
                <p className="text-[12px] text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  {errors.course}
                </p>
              )}
            </>
          )}
        </div>

        {/* Team Selection (Optional) */}
        <div>
          <label className="text-[14px] text-slate-700 mb-2 block flex items-center gap-2">
            <UsersIcon size={16} />
            Equipa (Opcional)
          </label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors"
          >
            <option value="">Sem equipa</option>
            {loadingTeams ? (
              <option value="">Carregando...</option>
            ) : (
              teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))
            )}
          </select>
          <p className="text-[12px] text-slate-500 mt-2">
            Pode atribuir o formando a uma equipa mais tarde
          </p>
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
              Criar Formando
            </>
          )}
        </button>

        {/* Espaçamento extra */}
        <div className="pb-32" />
      </div>
    </div>
  );
}
