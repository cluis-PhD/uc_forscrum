import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, MapPin, Users, Video } from 'lucide-react';
import { Header } from './shared/Header';
import { useApp } from '../context/AppContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CalendarViewProps {
  onNavigate?: (screen: string) => void;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'sprint' | 'meeting' | 'review' | 'planning';
  course: string;
  location?: string;
  participants?: number;
}

export function CalendarView({ onNavigate }: CalendarViewProps) {
  const { loggedStudent, userType } = useApp();
  const [currentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [sprints, setSprints] = useState<any[]>([]);
  const [loadingSprints, setLoadingSprints] = useState(true);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Carregar sprints do backend
  useEffect(() => {
    loadSprints();
  }, []);

  const loadSprints = async () => {
    try {
      setLoadingSprints(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/sprints`,
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
        if (data.success && Array.isArray(data.sprints)) {
          setSprints(data.sprints);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sprints:', error);
    } finally {
      setLoadingSprints(false);
    }
  };

  // Gerar Reuniões Diárias automaticamente para dias úteis (segunda a sexta)
  const generateDailyEvents = (): Event[] => {
    const dailyEvents: Event[] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Gerar para os próximos 14 dias úteis
    for (let i = 0; i < 20; i++) {
      const date = new Date(currentYear, currentMonth, today.getDate() + i);
      const dayOfWeek = date.getDay();
      
      // Só adicionar em dias úteis (1 = segunda, 5 = sexta)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        dailyEvents.push({
          id: `daily-${i}`,
          title: 'Reunião Diária',
          date: date.toISOString().split('T')[0],
          time: '09:15',
          type: 'meeting',
          course: 'Todas as Equipas',
          location: 'Online',
          participants: 25,
        });
      }
    }
    
    return dailyEvents;
  };

  // Converter sprints para eventos de calendário
  const generateSprintEvents = (): Event[] => {
    const sprintEvents: Event[] = [];

    sprints.forEach(sprint => {
      // Evento de início do sprint
      if (sprint.startDate) {
        sprintEvents.push({
          id: `sprint-start-${sprint.id}`,
          title: `Início: ${sprint.name}`,
          date: sprint.startDate,
          time: '09:00',
          type: 'sprint',
          course: sprint.courseName || 'Curso',
          location: 'Online',
          participants: 0,
        });
      }

      // Evento de fim do sprint
      if (sprint.endDate) {
        sprintEvents.push({
          id: `sprint-end-${sprint.id}`,
          title: `Fim: ${sprint.name}`,
          date: sprint.endDate,
          time: '17:00',
          type: 'sprint',
          course: sprint.courseName || 'Curso',
          location: 'Online',
          participants: 0,
        });
      }
    });

    return sprintEvents;
  };

  const staticEvents: Event[] = [
    {
      id: '1',
      title: 'Sprint Planning',
      date: '2024-12-11',
      time: '10:00',
      type: 'planning',
      course: 'Scrum Master Certificado',
      location: 'Sala 204',
      participants: 20,
    },
    {
      id: '3',
      title: 'Sprint Review',
      date: '2024-12-13',
      time: '14:00',
      type: 'review',
      course: 'Agile Fundamentals',
      location: 'Sala 305',
      participants: 13,
    },
    {
      id: '4',
      title: 'Retrospectiva Sprint 2',
      date: '2024-12-16',
      time: '15:00',
      type: 'review',
      course: 'Scrum Master Certificado',
      location: 'Sala 204',
      participants: 20,
    },
    {
      id: '5',
      title: 'Planning Poker - Equipa Alpha',
      date: '2024-12-18',
      time: '11:00',
      type: 'planning',
      course: 'Product Owner Avançado',
      location: 'Online',
      participants: 7,
    },
  ];

  // Combinar eventos estáticos com Reuniões Diárias e sprints
  const events: Event[] = [...staticEvents, ...generateDailyEvents(), ...generateSprintEvents()];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'sprint':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'meeting':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'review':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'planning':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sprint: 'Sprint',
      meeting: 'Reunião',
      review: 'Review',
      planning: 'Planning',
    };
    return labels[type] || type;
  };

  const todayEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    return eventDate.getDate() === currentDate.getDate();
  });

  const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    return eventDate >= currentDate;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24">
      {/* Header com seta de voltar */}
      <div className="bg-[#4aa540] px-6 pt-6 pb-3 rounded-b-[16px] shadow-lg">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => onNavigate?.('dashboard')}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="text-white" size={20} />
            </button>
            <h1 className="text-white text-[17px] text-center flex-1">Calendário</h1>
            <div className="w-9" />
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto px-6 py-6 space-y-4">
        {/* Month Selector */}
        <div className="bg-white rounded-[16px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <h3 className="text-[18px] text-slate-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week days */}
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
              <div key={idx} className="text-center text-[11px] text-slate-500 py-2">
                {day}
              </div>
            ))}

            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isToday = day === currentDate.getDate();
              const hasEvent = events.some(e => new Date(e.date).getDate() === day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-[8px] text-[13px] flex flex-col items-center justify-center transition-all ${
                    isToday
                      ? 'bg-[#4aa540] text-white font-semibold shadow-md'
                      : selectedDay === day
                      ? 'bg-[#4aa540]/20 text-[#4aa540] font-semibold'
                      : hasEvent
                      ? 'bg-blue-50 text-slate-700 hover:bg-blue-100'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {day}
                  {hasEvent && !isToday && (
                    <div className="w-1 h-1 bg-[#4aa540] rounded-full mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Today's Events */}
        {todayEvents.length > 0 && (
          <div>
            <h3 className="text-[17px] text-slate-800 mb-3">Hoje ({todayEvents.length})</h3>
            <div className="space-y-2">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-[14px] p-3 border-2 ${getEventTypeColor(event.type)} shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] px-2 py-0.5 bg-white/50 rounded-[6px]">
                          {getEventTypeLabel(event.type)}
                        </span>
                        <span className="text-[13px] font-semibold">{event.time}</span>
                      </div>
                      <h4 className="text-[15px] font-semibold mb-1">{event.title}</h4>
                      <p className="text-[12px] opacity-80">{event.course}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[12px]">
                    {event.location && (
                      <div className="flex items-center gap-1">
                        {event.location === 'Online' ? (
                          <Video size={12} />
                        ) : (
                          <MapPin size={12} />
                        )}
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.participants && (
                      <div className="flex items-center gap-1">
                        <Users size={12} />
                        <span>{event.participants}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div>
          <h3 className="text-[17px] text-slate-800 mb-3">Próximos Eventos</h3>
          <div className="space-y-2">
            {upcomingEvents.slice(0, 5).map((event) => {
              const eventDate = new Date(event.date);
              const isToday = eventDate.getDate() === currentDate.getDate();
              
              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-[14px] p-3 shadow-sm border-2 border-transparent hover:border-[#4aa540] transition-all ${
                    isToday ? 'ring-2 ring-[#4aa540]/20' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center justify-center bg-slate-100 rounded-[10px] px-3 py-2 min-w-[50px]">
                      <p className="text-[11px] text-slate-500 uppercase">
                        {monthNames[eventDate.getMonth()].slice(0, 3)}
                      </p>
                      <p className="text-[22px] text-slate-800 font-semibold leading-none">
                        {eventDate.getDate()}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] px-2 py-0.5 rounded-[6px] ${getEventTypeColor(event.type)}`}>
                          {getEventTypeLabel(event.type)}
                        </span>
                        <div className="flex items-center gap-1 text-[12px] text-slate-500">
                          <Clock size={12} />
                          <span>{event.time}</span>
                        </div>
                      </div>
                      <h4 className="text-[14px] text-slate-800 font-semibold mb-1">{event.title}</h4>
                      <p className="text-[12px] text-slate-500 mb-2">{event.course}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        {event.location && (
                          <div className="flex items-center gap-1">
                            {event.location === 'Online' ? <Video size={11} /> : <MapPin size={11} />}
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.participants && (
                          <div className="flex items-center gap-1">
                            <Users size={11} />
                            <span>{event.participants} participantes</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
