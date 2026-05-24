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
import { projectId, publicAnonKey } from '../utils/supabase/info';
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
    
    // Polling automático a cada 30 segundos
    const intervalId = setInterval(() => {
      console.log('[Alerts] 🔄 Auto-reload - A recarregar alertas...');
      loadAlerts();
    }, 30000);

    return () => {
      console.log('[Alerts] 🛑 Limpando polling automático');
      clearInterval(intervalId);
    };
  }, [loggedStudent]);

  // Atualizar contador de não lidos quando alerts ou readAlerts mudar
  useEffect(() => {
    const unreadCount = alerts.filter(a => !readAlerts.has(a.id)).length;
    setUnreadAlerts(unreadCount);
  }, [alerts, readAlerts, setUnreadAlerts]);

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
        console.log('[Alerts] Backend não disponível, usando dados do localStorage');
        const localAlerts = localStorage.getItem('forscrum_alerts');
        if (localAlerts) {
          const parsedAlerts = JSON.parse(localAlerts);
          
          // Filtrar alertas: mostrar os globais (sem courseId) ou os do curso do formando
          let filteredAlerts = parsedAlerts;
          if (loggedStudent?.courseId) {
            filteredAlerts = parsedAlerts.filter((alert: Alert) => 
              !alert.courseId || alert.courseId === loggedStudent.courseId
            );
            console.log('[Alerts] Alertas filtrados do localStorage para o curso:', loggedStudent.courseId, filteredAlerts.length);
          }
          
          // Ordenar por data (mais recentes primeiro)
          filteredAlerts.sort((a: Alert, b: Alert) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          setAlerts(filteredAlerts);
        } else {
          const mockAlerts: Alert[] = [
            {
              id: '1',
              type: 'urgent',
              title: 'Sprint Planning Amanhã',
              message: 'Reunião de Sprint Planning às 10h00 via Zoom. Todos os formandos devem participar.',
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
            {
              id: '2',
              type: 'warning',
              title: 'User Story Atrasada',
              message: 'A user story #23 está atrasada. Verifique o estado no SprintBoard.',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              courseId: loggedStudent?.courseId,
              courseName: loggedStudent?.courseName,
            },
            {
              id: '3',
              type: 'urgent',
              title: 'Prazo de Entrega',
              message: 'O prazo para entrega do projeto final é amanhã às 18h00.',
              createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
              courseId: loggedStudent?.courseId,
              courseName: loggedStudent?.courseName,
            },
            {
              id: '4',
              type: 'warning',
              title: 'Atualização de Material',
              message: 'Novo material sobre User Stories disponível para consulta.',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
          ];
          
          setAlerts(mockAlerts);
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.alerts)) {
        // Filtrar alertas: mostrar os globais (sem courseId) ou os do curso do formando
        let filteredAlerts = data.alerts;
        
        if (loggedStudent?.courseId) {
          filteredAlerts = data.alerts.filter((alert: Alert) => 
            !alert.courseId || alert.courseId === loggedStudent.courseId
          );
          console.log('[Alerts] Alertas filtrados para o curso:', loggedStudent.courseId, filteredAlerts.length);
        }
        
        // Ordenar por data (mais recentes primeiro)
        filteredAlerts.sort((a: Alert, b: Alert) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setAlerts(filteredAlerts);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      // Usar dados do localStorage ou mockados em caso de erro
      console.log('[Alerts] Erro no backend, usando dados do localStorage');
      const localAlerts = localStorage.getItem('forscrum_alerts');
      if (localAlerts) {
        const parsedAlerts = JSON.parse(localAlerts);
        
        // Filtrar alertas: mostrar os globais (sem courseId) ou os do curso do formando
        let filteredAlerts = parsedAlerts;
        if (loggedStudent?.courseId) {
          filteredAlerts = parsedAlerts.filter((alert: Alert) => 
            !alert.courseId || alert.courseId === loggedStudent.courseId
          );
          console.log('[Alerts] Alertas filtrados do localStorage para o curso:', loggedStudent.courseId, filteredAlerts.length);
        }
        
        // Ordenar por data (mais recentes primeiro)
        filteredAlerts.sort((a: Alert, b: Alert) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setAlerts(filteredAlerts);
      } else {
        const mockAlerts: Alert[] = [
          {
            id: '1',
            type: 'urgent',
            title: 'Sprint Planning Amanhã',
            message: 'Reunião de Sprint Planning às 10h00 via Zoom. Todos os formandos devem participar.',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            type: 'warning',
            title: 'Material de Estudo',
            message: 'Novo material sobre User Stories disponível.',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        
        setAlerts(mockAlerts);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = (alertId: string) => {
    setReadAlerts(prev => {
      const newSet = new Set(prev);
      newSet.add(alertId);

      // Atualizar localStorage para persistir alertas lidos
      const storedAlerts = localStorage.getItem('forscrum_alerts');
      if (storedAlerts) {
        const allAlerts = JSON.parse(storedAlerts);
        const updatedAlerts = allAlerts.map((a: Alert) =>
          a.id === alertId ? { ...a, read: true } : a
        );
        localStorage.setItem('forscrum_alerts', JSON.stringify(updatedAlerts));
        refreshUnreadCounts(); // Atualizar contador global
      }

      return newSet;
    });
  };

  const handleMarkAllAsRead = () => {
    const allIds = new Set(alerts.map(a => a.id));
    setReadAlerts(allIds);

    // Atualizar localStorage para persistir alertas lidos
    const storedAlerts = localStorage.getItem('forscrum_alerts');
    if (storedAlerts) {
      const allAlerts = JSON.parse(storedAlerts);
      const updatedAlerts = allAlerts.map((a: Alert) => ({ ...a, read: true }));
      localStorage.setItem('forscrum_alerts', JSON.stringify(updatedAlerts));
      refreshUnreadCounts(); // Atualizar contador global
    }

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
            <Loader2 className="text-[#0b87ac] animate-spin mb-4" size={40} />
            <p className="text-slate-600 text-[14px] dark:text-slate-400">A carregar alertas...</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-white rounded-[16px] p-4 shadow-sm dark:bg-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-1">Total de Alertas</p>
                  <p className="text-[26px] text-slate-800 dark:text-slate-200">{alerts.length}</p>
                </div>
                {unreadCount > 0 && (
                  <div className="bg-red-100 px-4 py-2 rounded-[12px] dark:bg-red-900/30">
                    <p className="text-[13px] text-red-600 dark:text-red-400 mb-1">Não Lidos</p>
                    <p className="text-[22px] text-red-600 dark:text-red-400 text-center">{unreadCount}</p>
                  </div>
                )}
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="w-full bg-[#0b87ac] text-white py-2 px-3 rounded-[10px] text-[14px] hover:bg-[#096d8a] transition-colors flex items-center justify-center gap-2"
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
                <h3 className="text-[18px] text-slate-800 mb-2 dark:text-slate-200">Sem Alertas</h3>
                <p className="text-[14px] text-slate-500 dark:text-slate-400">
                  Não existem alertas no momento.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-[17px] text-slate-800 dark:text-slate-200 mb-3">Todos os Alertas</h3>
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
                              <h4 className={`text-[15px] text-slate-800 dark:text-slate-200 ${!read ? 'font-semibold' : ''}`}>
                                {alert.title}
                              </h4>
                              {!read && (
                                <span className="bg-red-500 rounded-full w-2 h-2 mt-1.5 flex-shrink-0 ml-2"></span>
                              )}
                            </div>
                            <p className="text-[14px] text-slate-600 dark:text-slate-400 mb-2">{alert.message}</p>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="text-[12px] text-slate-400 dark:text-slate-500">
                                {formatTimestamp(alert.createdAt)}
                              </p>
                              {alert.courseName ? (
                                <span className="bg-white/50 px-2 py-1 rounded-[6px] text-[11px] text-slate-600 dark:text-slate-400">
                                  {alert.courseName}
                                </span>
                              ) : (
                                <span className="bg-purple-100 px-2 py-1 rounded-[6px] text-[11px] text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                  Geral
                                </span>
                              )}
                            </div>
                            {!read && (
                              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
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
