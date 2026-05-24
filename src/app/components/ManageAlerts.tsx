import { useState, useEffect } from 'react';
import { 
  Plus,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  Trash2,
  Edit2,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from './shared/Header';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useApp } from '../context/AppContext';

interface Alert {
  id: string;
  type: 'warning' | 'urgent';
  title: string;
  message: string;
  courseId?: string;
  courseName?: string;
  createdAt: string;
  createdBy: string;
}

interface ManageAlertsProps {
  onBack: () => void;
}

export function ManageAlerts({ onBack }: ManageAlertsProps) {
  const { refreshUnreadCounts } = useApp();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  
  // Form states
  const [formType, setFormType] = useState<'warning' | 'urgent'>('warning');
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formCourseId, setFormCourseId] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
    
    // Polling automático a cada 30 segundos
    const intervalId = setInterval(() => {
      console.log('[ManageAlerts] 🔄 Auto-reload - A recarregar alertas...');
      loadAlerts();
    }, 30000);

    return () => {
      console.log('[ManageAlerts] 🛑 Limpando polling automático');
      clearInterval(intervalId);
    };
  }, []);

  const loadData = async () => {
    await Promise.all([loadAlerts(), loadCourses()]);
  };

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/alerts`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        // Se o endpoint não existir, usar dados do localStorage ou mockados
        console.log('[ManageAlerts] Backend não disponível, usando dados do localStorage');
        const localAlerts = localStorage.getItem('forscrum_alerts');
        if (localAlerts) {
          const parsedAlerts = JSON.parse(localAlerts);
          setAlerts(parsedAlerts);
          console.log('[ManageAlerts] Alertas carregados do localStorage:', parsedAlerts.length);
        } else {
          const mockAlerts: Alert[] = [
            {
              id: '1',
              type: 'urgent',
              title: 'Sprint Planning Amanhã',
              message: 'Reunião de Sprint Planning às 10h00 via Zoom. Todos os formandos devem participar.',
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              createdBy: 'Formador',
            },
            {
              id: '2',
              type: 'warning',
              title: 'Material de Estudo Disponível',
              message: 'Novo material sobre User Stories disponível na plataforma.',
              courseId: courses[0]?.id || '1',
              courseName: courses[0]?.name || 'forScrum',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              createdBy: 'Formador',
            },
          ];
          setAlerts(mockAlerts);
          localStorage.setItem('forscrum_alerts', JSON.stringify(mockAlerts));
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
        // Sincronizar com localStorage
        localStorage.setItem('forscrum_alerts', JSON.stringify(data.alerts));
        console.log('[ManageAlerts] Alertas carregados:', data.alerts.length);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      // Usar dados do localStorage ou mockados em caso de erro
      console.log('[ManageAlerts] Erro no backend, usando dados do localStorage');
      const localAlerts = localStorage.getItem('forscrum_alerts');
      if (localAlerts) {
        const parsedAlerts = JSON.parse(localAlerts);
        setAlerts(parsedAlerts);
        console.log('[ManageAlerts] Alertas carregados do localStorage:', parsedAlerts.length);
      } else {
        const mockAlerts: Alert[] = [
          {
            id: '1',
            type: 'urgent',
            title: 'Sprint Planning Amanhã',
            message: 'Reunião de Sprint Planning às 10h00 via Zoom. Todos os formandos devem participar.',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            createdBy: 'Formador',
          },
          {
            id: '2',
            type: 'warning',
            title: 'Material de Estudo Disponível',
            message: 'Novo material sobre User Stories disponível na plataforma.',
            courseId: courses[0]?.id || '1',
            courseName: courses[0]?.name || 'forScrum',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdBy: 'Formador',
          },
        ];
        setAlerts(mockAlerts);
        localStorage.setItem('forscrum_alerts', JSON.stringify(mockAlerts));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/courses`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar cursos');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.courses)) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    }
  };

  const handleCreate = () => {
    setEditingAlert(null);
    setFormType('warning');
    setFormTitle('');
    setFormMessage('');
    setFormCourseId('all');
    setShowCreateModal(true);
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setFormType(alert.type);
    setFormTitle(alert.title);
    setFormMessage(alert.message);
    setFormCourseId(alert.courseId || 'all');
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.error('Preencha o título e a mensagem');
      return;
    }

    setIsSaving(true);
    try {
      const alertData = {
        type: formType,
        title: formTitle.trim(),
        message: formMessage.trim(),
        courseId: formCourseId === 'all' ? null : formCourseId,
        createdBy: 'Formador',
      };

      const url = editingAlert
        ? `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/alerts/${editingAlert.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/alerts`;

      const response = await fetch(url, {
        method: editingAlert ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        // Backend não disponível, simular sucesso localmente
        console.log('[ManageAlerts] Backend não disponível, usando simulação local');
        
        let updatedAlerts;
        if (editingAlert) {
          // Atualizar alerta existente
          updatedAlerts = alerts.map(a =>
            a.id === editingAlert.id
              ? {
                  ...a,
                  type: formType,
                  title: formTitle.trim(),
                  message: formMessage.trim(),
                  courseId: formCourseId === 'all' ? undefined : formCourseId,
                  courseName: formCourseId === 'all' ? undefined : courses.find(c => c.id === formCourseId)?.name,
                }
              : a
          );
          setAlerts(updatedAlerts);
          localStorage.setItem('forscrum_alerts', JSON.stringify(updatedAlerts));
          refreshUnreadCounts(); // Atualizar contador global
          toast.success('Alerta atualizado! (modo local)');
        } else {
          // Criar novo alerta
          const newAlert: Alert = {
            id: Date.now().toString(),
            type: formType,
            title: formTitle.trim(),
            message: formMessage.trim(),
            courseId: formCourseId === 'all' ? undefined : formCourseId,
            courseName: formCourseId === 'all' ? undefined : courses.find(c => c.id === formCourseId)?.name,
            createdAt: new Date().toISOString(),
            createdBy: 'Formador',
          };

          updatedAlerts = [newAlert, ...alerts];
          setAlerts(updatedAlerts);
          localStorage.setItem('forscrum_alerts', JSON.stringify(updatedAlerts));
          refreshUnreadCounts(); // Atualizar contador global
          toast.success('Alerta criado! (modo local)');
        }

        setShowCreateModal(false);
        return;
      }

      toast.success(editingAlert ? 'Alerta atualizado!' : 'Alerta criado!');
      setShowCreateModal(false);
      loadAlerts();
    } catch (error) {
      console.error('Erro ao salvar alerta:', error);
      
      // Em caso de erro de rede, também simular localmente
      console.log('[ManageAlerts] Erro de rede, usando simulação local');
      
      let updatedAlerts;
      if (editingAlert) {
        updatedAlerts = alerts.map(a =>
          a.id === editingAlert.id
            ? {
                ...a,
                type: formType,
                title: formTitle.trim(),
                message: formMessage.trim(),
                courseId: formCourseId === 'all' ? undefined : formCourseId,
                courseName: formCourseId === 'all' ? undefined : courses.find(c => c.id === formCourseId)?.name,
              }
            : a
        );
        setAlerts(updatedAlerts);
        localStorage.setItem('forscrum_alerts', JSON.stringify(updatedAlerts));
        refreshUnreadCounts(); // Atualizar contador global
        toast.success('Alerta atualizado! (modo local)');
      } else {
        const newAlert: Alert = {
          id: Date.now().toString(),
          type: formType,
          title: formTitle.trim(),
          message: formMessage.trim(),
          courseId: formCourseId === 'all' ? undefined : formCourseId,
          courseName: formCourseId === 'all' ? undefined : courses.find(c => c.id === formCourseId)?.name,
          createdAt: new Date().toISOString(),
          createdBy: 'Formador',
        };

        updatedAlerts = [newAlert, ...alerts];
        setAlerts(updatedAlerts);
        localStorage.setItem('forscrum_alerts', JSON.stringify(updatedAlerts));
        refreshUnreadCounts(); // Atualizar contador global
        toast.success('Alerta criado! (modo local)');
      }

      setShowCreateModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (alertId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja apagar o alerta "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/alerts/${alertId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        // Backend não disponível, simular remoção local
        console.log('[ManageAlerts] Backend não disponível, removendo localmente');
        const updatedAlerts = alerts.filter(a => a.id !== alertId);
        setAlerts(updatedAlerts);
        localStorage.setItem('forscrum_alerts', JSON.stringify(updatedAlerts));
        refreshUnreadCounts(); // Atualizar contador global
        toast.success('Alerta apagado! (modo local)');
        return;
      }

      toast.success('Alerta apagado!');
      loadAlerts();
      refreshUnreadCounts(); // Atualizar contador global
    } catch (error) {
      console.error('Erro ao apagar alerta:', error);
      // Em caso de erro de rede, também simular remoção local
      console.log('[ManageAlerts] Erro de rede, removendo localmente');
      const updatedAlerts = alerts.filter(a => a.id !== alertId);
      setAlerts(updatedAlerts);
      localStorage.setItem('forscrum_alerts', JSON.stringify(updatedAlerts));
      refreshUnreadCounts(); // Atualizar contador global
      toast.success('Alerta apagado! (modo local)');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'warning':
        return <Clock className="text-orange-500" size={20} />;
      default:
        return <Info className="text-slate-500" size={20} />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-PT');
  };

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 pt-[100px] dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <Header
        title="Gerir Alertas"
        onBack={onBack}
        showProfile={false}
        onPlay={handleCreate}
      />

      {/* Main Content */}
      <div className="max-w-[390px] mx-auto px-6 pt-6 space-y-4">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-[#4aa540] to-[#3d8935] rounded-[16px] p-5 shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-[12px] mb-1">Total de Alertas</p>
              <p className="text-[32px]">{alerts.length}</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-[10px] hover:bg-white/30 transition-colors text-white text-[14px] font-medium"
              aria-label="Criar novo alerta"
            >
              Novo Alerta
            </button>
          </div>
        </div>

        {/* Alerts List */}
        {isLoading && alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="text-[#4aa540] animate-spin mb-4" size={40} />
            <p className="text-slate-600 text-[14px] dark:text-slate-400">A carregar alertas...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-[16px] p-8 shadow-sm text-center dark:bg-slate-800">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-slate-700">
              <AlertCircle className="text-slate-400" size={32} />
            </div>
            <h3 className="text-[18px] text-slate-800 mb-2 dark:text-slate-200">Nenhum Alerta Criado</h3>
            <p className="text-[14px] text-slate-500 mb-6 dark:text-slate-400">
              Crie o primeiro alerta para notificar os formandos.
            </p>
            <button
              onClick={handleCreate}
              className="w-full bg-[#4aa540] text-white py-4 rounded-[14px] text-[16px] hover:bg-[#3d8935] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Criar Primeiro Alerta
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-[16px] p-4 border-2 ${getAlertColor(alert.type)} shadow-sm dark:bg-slate-800 dark:border-slate-700`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] text-slate-800 dark:text-slate-200 mb-1">
                      {alert.title}
                    </h4>
                    <p className="text-[14px] text-slate-600 dark:text-slate-400 mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] text-slate-400 dark:text-slate-500">
                          {formatDate(alert.createdAt)}
                        </p>
                        {alert.courseName ? (
                          <span className="bg-white/50 px-2 py-1 rounded-[6px] text-[11px] text-slate-600 dark:text-slate-400">
                            {alert.courseName}
                          </span>
                        ) : (
                          <span className="bg-purple-100 px-2 py-1 rounded-[6px] text-[11px] text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            Todos os cursos
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(alert)}
                          className="bg-blue-100 p-2 rounded-[8px] hover:bg-blue-200 transition-colors"
                          aria-label="Editar alerta"
                        >
                          <Edit2 className="text-blue-600" size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(alert.id, alert.title)}
                          className="bg-red-100 p-2 rounded-[8px] hover:bg-red-200 transition-colors"
                          aria-label="Apagar alerta"
                        >
                          <Trash2 className="text-red-600" size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[20px] w-full max-w-md shadow-2xl dark:bg-slate-800">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#4aa540] to-[#3d8935] rounded-t-[20px] p-5 flex items-center justify-between">
              <h2 className="text-white text-[18px]">
                {editingAlert ? 'Editar Alerta' : 'Criar Novo Alerta'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
              >
                <X className="text-white" size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="text-[13px] text-slate-700 dark:text-slate-300 mb-2 block font-medium">
                  Tipo de Alerta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'warning', label: 'Aviso', color: 'bg-orange-100 text-orange-700 border-orange-300' },
                    { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-300' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormType(type.value as any)}
                      className={`py-2 px-3 rounded-[10px] text-[13px] border-2 transition-all ${
                        formType === type.value
                          ? type.color + ' border-2'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[13px] text-slate-700 dark:text-slate-300 mb-2 block font-medium">
                  Título
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Sprint Planning Amanhã"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-[12px] text-[14px] focus:outline-none focus:border-[#4aa540] dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                  maxLength={100}
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-[13px] text-slate-700 dark:text-slate-300 mb-2 block font-medium">
                  Mensagem
                </label>
                <textarea
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="Descreva o alerta..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-[12px] text-[14px] focus:outline-none focus:border-[#4aa540] resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                  maxLength={300}
                />
              </div>

              {/* Course */}
              <div>
                <label className="text-[13px] text-slate-700 dark:text-slate-300 mb-2 block font-medium">
                  Curso (Opcional)
                </label>
                <select
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-[12px] text-[14px] focus:outline-none focus:border-[#4aa540] dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                >
                  <option value="all">Todos os cursos</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-[12px] text-[14px] hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-300"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-[#4aa540] text-white py-3 rounded-[12px] text-[14px] hover:bg-[#3d8935] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      A guardar...
                    </>
                  ) : (
                    editingAlert ? 'Atualizar' : 'Enviar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
