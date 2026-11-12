import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Clock,
  Check,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './shared/Header';
import { API_URL } from '../data/database';
import { toast } from 'sonner';

interface AlertsProps {
  onNavigate?: (screen: string) => void;
}

interface Alert {
  id: string;
  type: 'warning' | 'urgent';
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
  courseId?: string;
  courseName?: string;
}

export function Alerts({ onNavigate }: AlertsProps) {
  const { setUnreadAlerts, loggedStudent, refreshUnreadCounts } = useApp();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAlerts();
    
    // Atualizar a cada 30 segundos
    const intervalId = setInterval(loadAlerts, 30000);
    return () => clearInterval(intervalId);
  }, [loggedStudent]);

  // Atualizar contador de não lidos quando alerts ou readAlerts mudar
  useEffect(() => {
    const unreadCount = alerts.filter(a => !readAlerts.has(a.id)).length;
    setUnreadAlerts(unreadCount);
  }, [alerts, readAlerts, setUnreadAlerts]);

  // Quem está a ler: o formando com sessão iniciada, ou o formador
  const readerId = loggedStudent?.id || 'formador';

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const courseFilter = loggedStudent?.courseId
        ? `?courseId=${encodeURIComponent(loggedStudent.courseId)}`
        : '';
      const alertsRes = await fetch(`${API_URL}/alerts${courseFilter}`).then(r => r.json());
      setAlerts(alertsRes.success && Array.isArray(alertsRes.alerts) ? alertsRes.alerts : []);
      // O registo de leituras é independente: se falhar, os alertas continuam visíveis
      const readsRes = await fetch(`${API_URL}/alert-reads?readerId=${encodeURIComponent(readerId)}`)
        .then(r => r.json())
        .catch(() => ({}));
      setReadAlerts(new Set(readsRes.success ? readsRes.alertIds : []));
    } catch (error) {
      console.error('[Alerts] Erro ao carregar alertas:', error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReads = async (alertIds: string[]) => {
    try {
      await fetch(`${API_URL}/alert-reads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readerId, alertIds }),
      });
      refreshUnreadCounts();
    } catch (error) {
      console.error('[Alerts] Erro ao guardar leitura:', error);
    }
  };

  const handleMarkAsRead = (alertId: string) => {
    setReadAlerts(prev => new Set(prev).add(alertId));
    saveReads([alertId]);
  };

  const handleMarkAllAsRead = () => {
    const allIds = alerts.map(a => a.id);
    setReadAlerts(new Set(allIds));
    saveReads(allIds);
    toast.success('Todos os alertas marcados como lidos');
  };

  const isAlertRead = (alertId: string) => readAlerts.has(alertId);
  const unreadCount = alerts.filter(a => !isAlertRead(a.id)).length;

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
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      default:
        return 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-PT');
  };

  const handleBack = () => {
    onNavigate?.('dashboard');
  };

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 pt-[100px] dark:bg-slate-900 transition-colors duration-200">
      {/* Header Fixo */}
      <Header title="Alertas" onBack={handleBack} showProfile={false} />

      {/* Main Content */}
      <div className="max-w-[390px] mx-auto px-6 pt-6 space-y-4">
        {isLoading && alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="text-[#0a7da0] animate-spin mb-4" size={40} />
            <p className="text-slate-600 text-[0.875rem] dark:text-slate-400">A carregar alertas...</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-white rounded-[16px] p-4 shadow-sm dark:bg-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[0.8125rem] text-slate-500 dark:text-slate-400 mb-1">Total de Alertas</p>
                  <p className="text-[1.625rem] text-slate-800 dark:text-slate-200">{alerts.length}</p>
                </div>
                {unreadCount > 0 && (
                  <div className="bg-red-100 px-4 py-2 rounded-[12px] dark:bg-red-900/30">
                    <p className="text-[0.8125rem] text-red-600 dark:text-red-400 mb-1">Não Lidos</p>
                    <p className="text-[1.375rem] text-red-600 dark:text-red-400 text-center">{unreadCount}</p>
                  </div>
                )}
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="w-full bg-[#0a7da0] text-white py-2 px-3 rounded-[10px] text-[0.875rem] hover:bg-[#096d8a] transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Marcar Todos como Lidos
                </button>
              )}
            </div>

            {/* Alerts List */}
            {alerts.length === 0 ? (
              <div className="bg-white rounded-[16px] p-8 shadow-sm text-center dark:bg-slate-800">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-slate-700">
                  <AlertCircle className="text-slate-400" size={32} />
                </div>
                <h3 className="text-[1.125rem] text-slate-800 mb-2 dark:text-slate-200">Sem Alertas</h3>
                <p className="text-[0.875rem] text-slate-500 dark:text-slate-400">
                  Não existem alertas no momento.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-[1.0625rem] text-slate-800 dark:text-slate-200 mb-3">Todos os Alertas</h3>
                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const read = isAlertRead(alert.id);
                    return (
                      <div
                        key={alert.id}
                        onClick={() => !read && handleMarkAsRead(alert.id)}
                        className={`rounded-[16px] p-4 border-2 ${getAlertColor(alert.type)} ${
                          !read ? 'shadow-md cursor-pointer hover:shadow-lg' : 'shadow-sm opacity-70'
                        } transition-all`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className={`text-[0.9375rem] text-slate-800 dark:text-slate-200 ${!read ? 'font-semibold' : ''}`}>
                                {alert.title}
                              </h4>
                              {!read && (
                                <span className="bg-red-500 rounded-full w-2 h-2 mt-1.5 flex-shrink-0 ml-2"></span>
                              )}
                            </div>
                            <p className="text-[0.875rem] text-slate-600 dark:text-slate-400 mb-2">{alert.message}</p>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="text-[0.75rem] text-slate-400 dark:text-slate-500">
                                {formatTimestamp(alert.createdAt)}
                              </p>
                              {alert.courseName ? (
                                <span className="bg-white/50 px-2 py-1 rounded-[6px] text-[0.6875rem] text-slate-600 dark:text-slate-400">
                                  {alert.courseName}
                                </span>
                              ) : (
                                <span className="bg-purple-100 px-2 py-1 rounded-[6px] text-[0.6875rem] text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                  Geral
                                </span>
                              )}
                            </div>
                            {!read && (
                              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-[0.6875rem] text-slate-400 dark:text-slate-500 italic">
                                  Clique para marcar como lido
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
