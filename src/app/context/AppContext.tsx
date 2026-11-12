import { API_URL } from '../data/database';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  expertise: string;
  avatar: string;
}

interface SelectedUserStory {
  id: string;
  title: string;
  description?: string;
  points?: number;
  status?: string;
  team?: string;
}

interface SelectedCourse {
  id: string;
  name: string;
}

interface LoggedStudent {
  id: string;
  name: string;
  teamId: string | null;
  teamName: string | null;
  courseId: string;
  courseName: string;
}

interface AppContextType {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  unreadMessages: number;
  setUnreadMessages: (count: number) => void;
  markMessagesAsRead: () => void;
  unreadAlerts: number;
  setUnreadAlerts: (count: number) => void;
  markAlertsAsRead: () => void;
  userType: 'formador' | 'formando' | null;
  setUserType: (type: 'formador' | 'formando' | null) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  selectedUserStory: SelectedUserStory | null;
  setSelectedUserStory: (story: SelectedUserStory | null) => void;
  selectedCourse: SelectedCourse | null;
  setSelectedCourse: (course: SelectedCourse | null) => void;
  loggedStudent: LoggedStudent | null;
  setLoggedStudent: (student: LoggedStudent | null) => void;
  fontSize: 'normal' | 'large' | 'extra-large';
  setFontSize: (size: 'normal' | 'large' | 'extra-large') => void;
  previousScreen: string | null;
  setPreviousScreen: (screen: string | null) => void;
  refreshUnreadCounts: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<'formador' | 'formando' | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedUserStory, setSelectedUserStory] = useState<SelectedUserStory | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);
  const [loggedStudent, setLoggedStudent] = useState<LoggedStudent | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Carlos Luís',
    email: 'ccluis@gmail.com',
    phone: '+351 966 224 649',
    location: 'Coimbra, Portugal',
    bio: 'Formador',
    expertise: 'Educação de Adultos',
    avatar: 'CL',
  });

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // Atualizar contadores de mensagens e alertas não lidos (a partir da base de dados)
  const refreshUnreadCounts = async () => {
    if (!userType) return;
    try {
      const params = new URLSearchParams({ userType });
      if (loggedStudent?.id) params.set('studentId', loggedStudent.id);
      if (loggedStudent?.courseId) params.set('courseId', loggedStudent.courseId);
      const response = await fetch(`${API_URL}/unread?${params}`);
      const data = await response.json();
      if (data.success) {
        setUnreadMessages(data.messages || 0);
        setUnreadAlerts(data.alerts || 0);
      }
    } catch (error) {
      console.error('[AppContext] Erro ao contar mensagens/alertas não lidos:', error);
    }
  };


  // Atualizar contadores quando userType ou loggedStudent mudar
  useEffect(() => {
    if (userType) {
      refreshUnreadCounts();

      // Polling a cada 30 segundos para manter os números atualizados
      const intervalId = setInterval(() => {
        refreshUnreadCounts();
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [userType, loggedStudent?.id]);

  const markMessagesAsRead = () => {
    setUnreadMessages(0);
  };

  const markAlertsAsRead = () => {
    setUnreadAlerts(0);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [previousScreen, setPreviousScreen] = useState<string | null>(null);

  return (
    <AppContext.Provider
      value={{
        userProfile,
        setUserProfile,
        unreadMessages,
        setUnreadMessages,
        markMessagesAsRead,
        unreadAlerts,
        setUnreadAlerts,
        markAlertsAsRead,
        userType,
        setUserType,
        theme,
        toggleTheme,
        selectedUserStory,
        setSelectedUserStory,
        selectedCourse,
        setSelectedCourse,
        loggedStudent,
        setLoggedStudent,
        fontSize,
        setFontSize,
        previousScreen,
        setPreviousScreen,
        refreshUnreadCounts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
