import { MessageSquare, Settings, Bell, ArrowLeft, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onNavigate?: (screen: string) => void;
  title?: string;
  showActions?: boolean;
  onBack?: () => void;
  onCreate?: () => void;
  showProfile?: boolean; // Controla se mostra botão de definições
}

export function Header({ onNavigate, title, showActions = true, onBack, onCreate, showProfile = true }: HeaderProps) {
  const { userProfile, unreadMessages, unreadAlerts, userType, selectedCourse, theme } = useApp();
  
  // Cores dinâmicas baseado no userType
  const primaryColor = userType === 'formando' ? '#0b87ac' : '#4aa540';
  const secondaryColor = userType === 'formando' ? '#096d8a' : '#3d8935';
  
  // Cores para modo escuro (mais escuras)
  const darkPrimaryColor = userType === 'formando' ? '#075d76' : '#3d8935';
  const darkSecondaryColor = userType === 'formando' ? '#054a5e' : '#2d6828';

  return (
    <div 
      className="px-6 pt-12 pb-4 shadow-lg fixed top-0 left-0 right-0 z-50"
      style={{
        background: theme === 'dark'
          ? `linear-gradient(to bottom right, ${darkPrimaryColor} 0%, ${darkPrimaryColor} 70%, ${darkSecondaryColor} 100%)`
          : `linear-gradient(to bottom right, ${primaryColor} 0%, ${primaryColor} 70%, ${secondaryColor} 100%)`
      }}
    >
      <div className="max-w-[390px] mx-auto">
        {/* Top Bar - sempre presente (só no dashboard/home) */}
        {showActions && !title && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white text-base shadow-lg border border-white/20">
                {userProfile.avatar}
              </div>
              <div>
                <p className="text-white/80 text-xs font-medium tracking-wide">forScrum</p>
                <h1 className="text-white text-lg font-medium drop-shadow-sm">{userProfile.name}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Botão de definições só aparece no dashboard */}
              <button 
                onClick={() => onNavigate?.('profile')}
                className="bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:bg-white/30 transition-all shadow-md border border-white/20 hover:scale-105 active:scale-95"
              >
                <Settings className="text-white" size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Título customizado com botões de navegação (se fornecido) */}
        {title && (
          <div className="flex items-center justify-between">
            {onBack ? (
              <button 
                onClick={onBack}
                className="bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:bg-white/30 transition-all shadow-md border border-white/20 hover:scale-105 active:scale-95"
              >
                <ArrowLeft className="text-white" size={20} />
              </button>
            ) : (
              <div className="w-10" />
            )}
            <h2 className="text-white text-lg font-medium text-center flex-1 drop-shadow-sm">{title}</h2>
            <div className="flex gap-2">
              {/* Botão de criar (se fornecido) */}
              {onCreate && (
                <button 
                  onClick={onCreate}
                  className="bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:bg-white/30 transition-all shadow-md border border-white/20 hover:scale-105 active:scale-95"
                >
                  <Plus className="text-white" size={20} />
                </button>
              )}
              {/* Botão de definições (só se showProfile for true) */}
              {showProfile && (
                <button 
                  onClick={() => onNavigate?.('profile')}
                  className="bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:bg-white/30 transition-all shadow-md border border-white/20 hover:scale-105 active:scale-95"
                >
                  <Settings className="text-white" size={20} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
