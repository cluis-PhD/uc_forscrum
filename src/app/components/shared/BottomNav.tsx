import { Home, BookOpen, Bell, Calendar, LogOut, ListTodo, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onLogout?: () => void;
}

export function BottomNav({ currentScreen, onNavigate, onLogout }: BottomNavProps) {
  const { userType } = useApp();
  
  // Cores dinâmicas baseadas no tipo de utilizador
  const primaryColor = userType === 'formando' ? '#0b87ac' : '#4aa540';
  
  // Itens de navegação diferentes para formador e formando
  const navItems = userType === 'formando' 
    ? [
        { id: 'dashboard', label: 'Home', icon: Home },
        { id: 'courseDetails', label: 'Sprints', icon: ListTodo },
        { id: 'messagesFormando', label: 'Mensagens', icon: MessageSquare },
        { id: 'alerts', label: 'Alertas', icon: Bell },
        { id: 'logout', label: 'Sair', icon: LogOut },
      ]
    : [
        { id: 'dashboard', label: 'Home', icon: Home },
        { id: 'courses', label: 'Cursos', icon: BookOpen },
        { id: 'alerts', label: 'Alertas', icon: Bell },
        { id: 'calendar', label: 'Calendário', icon: Calendar },
        { id: 'logout', label: 'Sair', icon: LogOut },
      ];

  const isActive = (screenId: string) => {
    if (screenId === 'dashboard' && currentScreen === 'dashboard') return true;
    if (screenId === 'courses' && (currentScreen === 'courses' || currentScreen === 'courseManagement' || currentScreen === 'courseDetails')) return true;
    if (screenId === 'courseDetails' && (currentScreen === 'courseDetails' || currentScreen === 'sprintBoard')) return true;
    if (screenId === currentScreen) return true;
    return false;
  };

  const handleNavClick = (itemId: string) => {
    if (itemId === 'logout') {
      onLogout?.();
    } else {
      onNavigate(itemId);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[390px] bg-white border-t-2 border-slate-200 shadow-lg z-50 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-200">
      <div className="px-4 py-2.5">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            const isLogoutButton = item.id === 'logout';

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-[12px] transition-all ${
                  isLogoutButton
                    ? 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : active
                    ? `text-[${primaryColor}] hover:opacity-80`
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-700'
                }`}
                style={{
                  backgroundColor: active && !isLogoutButton ? `${primaryColor}15` : undefined,
                  color: active && !isLogoutButton ? primaryColor : undefined,
                }}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[11px] ${active ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}