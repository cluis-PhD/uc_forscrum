import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Send,
  Search,
  Filter,
  Users,
  User,
  CheckCheck
} from 'lucide-react';
import { toast } from "sonner";
import { useApp } from '../context/AppContext';

interface MessagesProps {
  onBack: () => void;
}

interface Conversation {
  id: string;
  name: string;
  type: 'course' | 'team' | 'individual';
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
}

export function Messages({ onBack }: MessagesProps) {
  const { markMessagesAsRead } = useApp();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Marcar mensagens como lidas quando entra neste componente
  useEffect(() => {
    markMessagesAsRead();
  }, [markMessagesAsRead]);

  const conversations: Conversation[] = [
    {
      id: '1',
      name: 'forScrum',
      type: 'course',
      lastMessage: 'Olá turma! Lembrete: próximo sprint planning na sexta.',
      timestamp: 'Há 2h',
      unread: 3,
      avatar: 'SMC',
    },
    {
      id: '2',
      name: 'Equipa Alpha',
      type: 'team',
      lastMessage: 'Boa tarde! Alguém pode ajudar com a user story #23?',
      timestamp: 'Há 5h',
      unread: 1,
      avatar: 'EA',
    },
    {
      id: '3',
      name: 'Pedro Santos',
      type: 'individual',
      lastMessage: 'Professor, tenho uma dúvida sobre os critérios de aceitação.',
      timestamp: 'Ontem',
      unread: 0,
      avatar: 'PS',
    },
    {
      id: '4',
      name: 'Educação e Formação de Adultos nivel Básico',
      type: 'course',
      lastMessage: 'Materiais da próxima aula disponíveis na plataforma.',
      timestamp: 'Ontem',
      unread: 0,
      avatar: 'POA',
    },
    {
      id: '5',
      name: 'Maria Costa',
      type: 'individual',
      lastMessage: 'Obrigado pela explicação! Já consegui resolver.',
      timestamp: '2 dias',
      unread: 0,
      avatar: 'MC',
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <Users size={16} className="text-blue-600" />;
      case 'team':
        return <Users size={16} className="text-purple-600" />;
      case 'individual':
        return <User size={16} className="text-green-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-100';
      case 'team':
        return 'bg-purple-100';
      case 'individual':
        return 'bg-green-100';
      default:
        return 'bg-slate-100';
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    toast.success('Mensagem enviada!');
    setMessage('');
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif]">
      {/* Header */}
      <div className="bg-[#4aa540] px-6 pt-12 pb-6 rounded-b-[24px] shadow-lg">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onBack}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="text-white" size={24} />
            </button>
            <h1 className="text-white text-[20px]">Mensagens</h1>
            <button 
              onClick={() => toast.info('Filtros em desenvolvimento')}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <Filter className="text-white" size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar conversas..."
              className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-[12px] pl-10 pr-4 py-2 text-[14px] text-white placeholder:text-white/60 focus:outline-none focus:bg-white/30 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="w-full max-w-md mx-auto px-6 py-6 space-y-3">
        {selectedConversation ? (
          // Chat View
          <div className="bg-white rounded-[16px] shadow-sm overflow-hidden">
            {/* Chat Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedConversation(null)}
                className="flex items-center gap-3"
              >
                <ArrowLeft size={20} className="text-slate-600" />
                <div>
                  <h3 className="text-[14px] text-slate-800">
                    {conversations.find(c => c.id === selectedConversation)?.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">Online</p>
                </div>
              </button>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-3 min-h-[400px] max-h-[500px] overflow-y-auto">
              {/* Received Message */}
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[11px] flex-shrink-0">
                  PS
                </div>
                <div>
                  <div className="bg-slate-100 rounded-[12px] rounded-tl-none p-3 max-w-[250px]">
                    <p className="text-[13px] text-slate-800">
                      Professor, tenho uma dúvida sobre os critérios de aceitação da user story.
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-2">Há 30 min</p>
                </div>
              </div>

              {/* Sent Message */}
              <div className="flex gap-2 justify-end">
                <div>
                  <div className="bg-[#4aa540] rounded-[12px] rounded-tr-none p-3 max-w-[250px]">
                    <p className="text-[13px] text-white">
                      Olá Pedro! Claro, os critérios de aceitação devem ser mensuráveis e testáveis. Quer agendar uma call?
                    </p>
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-1 mr-2">
                    <p className="text-[10px] text-slate-400">Há 28 min</p>
                    <CheckCheck size={14} className="text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Received Message */}
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[11px] flex-shrink-0">
                  PS
                </div>
                <div>
                  <div className="bg-slate-100 rounded-[12px] rounded-tl-none p-3 max-w-[250px]">
                    <p className="text-[13px] text-slate-800">
                      Seria ótimo! Estou disponível amanhã de manhã.
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-2">Há 25 min</p>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escrever mensagem..."
                  className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-[12px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#4aa540] transition-colors"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-[#4aa540] p-3 rounded-[12px] text-white hover:bg-[#3d8935] transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Conversations List
          <>
            <p className="text-[12px] text-slate-500 mb-2">
              {filteredConversations.length} conversas
            </p>

            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className="bg-white rounded-[16px] p-4 shadow-sm hover:shadow-md transition-all w-full text-left border-2 border-transparent hover:border-[#4aa540]"
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className={`w-12 h-12 ${getTypeColor(conv.type)} rounded-full flex items-center justify-center text-[14px] flex-shrink-0`}>
                    <div className="absolute">
                      {getTypeIcon(conv.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[14px] text-slate-800 truncate">{conv.name}</h3>
                      <span className="text-[11px] text-slate-400">{conv.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-slate-500 truncate pr-2">{conv.lastMessage}</p>
                      {conv.unread > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full flex-shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {filteredConversations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 text-[14px]">Nenhuma conversa encontrada</p>
              </div>
            )}
          </>
        )}

        <div className="pb-8" />
      </div>
    </div>
  );
}
