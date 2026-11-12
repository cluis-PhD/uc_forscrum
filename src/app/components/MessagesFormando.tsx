import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Mail, Pencil, Trash2, MessageSquare, User } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from './shared/Header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useApp } from '../context/AppContext';
import { API_URL } from '../data/database';

interface Message {
  id: string;
  formandoId: string;
  formandoName: string;
  formadorName: string;
  title: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
  editedAt?: string;
  isRead?: boolean;
  sentBy: 'formador' | 'formando'; // Indica quem enviou a mensagem
}

interface MessagesFormandoProps {
  onBack: () => void;
}

export function MessagesFormando({ onBack }: MessagesFormandoProps) {
  const { userType, userProfile, loggedStudent, selectedCourse, refreshUnreadCounts } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedFormandoId, setSelectedFormandoId] = useState('');
  
  // Students list
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const isFormador = userType === 'formador';
  
  // ID e nome do usuário
  const userId = isFormador ? userProfile.name : loggedStudent?.id || '';
  const userName = isFormador ? userProfile.name : loggedStudent?.name || 'Formando';


  // Carregar mensagens da base de dados
  useEffect(() => {
    loadMessages();
    if (isFormador) {
      loadStudents();
    }
    // Atualizar a cada 30 segundos para ver mensagens novas
    const intervalId = setInterval(loadMessages, 30000);
    return () => clearInterval(intervalId);
  }, [isFormador, userId, userType]);

  const loadMessages = async () => {
    try {
      // Formador vê todas as mensagens; formando vê as que o formador lhe enviou
      const query = isFormador
        ? ''
        : `?formandoId=${encodeURIComponent(userId)}`; // recebidas e enviadas pelo formando
      if (!isFormador && !userId) {
        setMessages([]);
        return;
      }
      const response = await fetch(`${API_URL}/messages${query}`);
      const data = await response.json();
      setMessages(data.success && Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]);
    }
  };

  const sendRequest = async (url: string, method: string, body?: any) => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) throw new Error(data.error || 'Erro na base de dados');
    return data;
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await fetch(
        `${API_URL}/students`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar formandos');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.students)) {
        // Filtrar formandos do curso atual se houver curso selecionado
        const courseStudents = selectedCourse?.id 
          ? data.students.filter((s: any) => s.courseId === selectedCourse.id)
          : data.students;
        setStudents(courseStudents);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Erro ao carregar formandos:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const afterChange = async () => {
    await loadMessages();
    refreshUnreadCounts();
  };

  const handleCreateMessage = async () => {
    if (!title.trim() || !messageText.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (isFormador && !selectedFormandoId) {
      toast.error('Selecione um formando');
      return;
    }

    const selectedStudent = students.find(s => s.id === selectedFormandoId);
    const newMessage = isFormador
      ? {
          formandoId: selectedFormandoId,
          formandoName: selectedStudent?.name || 'Desconhecido',
          formadorName: userName,
          sentBy: 'formador',
        }
      : {
          formandoId: userId,
          formandoName: userName,
          formadorName: 'Formador',
          sentBy: 'formando',
        };

    try {
      await sendRequest(`${API_URL}/messages`, 'POST', {
        ...newMessage,
        title: title.trim(),
        message: messageText.trim(),
        isRead: false,
      });
      setTitle('');
      setMessageText('');
      setSelectedFormandoId('');
      setIsCreateOpen(false);
      toast.success('Mensagem enviada com sucesso!');
      afterChange();
    } catch (error) {
      toast.error(`Não foi possível enviar: ${(error as Error).message}`);
    }
  };

  const handleUpdateMessage = async () => {
    if (!selectedMessage || !title.trim() || !messageText.trim() || !selectedFormandoId) {
      toast.error('Preencha todos os campos');
      return;
    }
    const selectedStudent = students.find(s => s.id === selectedFormandoId);
    try {
      await sendRequest(`${API_URL}/messages/${selectedMessage.id}`, 'PUT', {
        formandoId: selectedFormandoId,
        formandoName: selectedStudent?.name || selectedMessage.formandoName,
        title: title.trim(),
        message: messageText.trim(),
      });
      setTitle('');
      setMessageText('');
      setSelectedFormandoId('');
      setSelectedMessage(null);
      setIsEditOpen(false);
      toast.success('Mensagem atualizada com sucesso!');
      afterChange();
    } catch (error) {
      toast.error(`Não foi possível guardar: ${(error as Error).message}`);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!confirm(`Tem certeza que deseja apagar a mensagem "${message?.title}"?`)) return;
    try {
      await sendRequest(`${API_URL}/messages/${messageId}`, 'DELETE');
      toast.success('Mensagem apagada com sucesso!');
      afterChange();
    } catch (error) {
      toast.error(`Não foi possível apagar: ${(error as Error).message}`);
    }
  };

  // Mensagem que chegou do outro lado (para o formando: do formador; para o formador: de um formando)
  const isIncoming = (message: Message) =>
    isFormador ? message.sentBy === 'formando' : message.sentBy === 'formador';

  const handleViewMessage = async (message: Message) => {
    setSelectedMessage(message);
    setIsViewOpen(true);

    // Marcar como lida quando o destinatário a abre
    if (isIncoming(message) && !message.isRead) {
      try {
        await sendRequest(`${API_URL}/messages/${message.id}`, 'PUT', { isRead: true });
        afterChange();
      } catch {
        /* não crítico */
      }
    }
  };

  const openEditModal = (message: Message) => {
    setSelectedMessage(message);
    setTitle(message.title);
    setMessageText(message.message);
    setSelectedFormandoId(message.formandoId);
    setIsEditOpen(true);
  };

  // Função para abrir modal de Nova Mensagem
  const openNewMessageModal = () => {
    setTitle('');
    setMessageText('');
    setSelectedFormandoId('');
    setIsCreateOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Contar mensagens recebidas e ainda não lidas
  const unreadCount = messages.filter(m => isIncoming(m) && !m.isRead).length;

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 pt-[110px] dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <Header 
        title={isFormador ? "Mensagens" : "Minhas Mensagens"} 
        onBack={onBack} 
        showProfile={false} 
      />

      {/* Content */}
      <div className="w-full max-w-md mx-auto px-6 py-4 space-y-4">
        {/* Header com contador */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[1rem] text-slate-800 dark:text-slate-100">
              {isFormador ? 'Todas as Mensagens' : 'As minhas mensagens'} ({messages.length})
            </h3>
            {unreadCount > 0 && (
              <p className="text-[0.75rem] text-orange-600 dark:text-orange-400">
                {unreadCount} {unreadCount === 1 ? 'mensagem nova' : 'mensagens novas'}
              </p>
            )}
          </div>
          
          <button
            onClick={openNewMessageModal}
            className="bg-[#3b8433] text-white px-3 py-2 rounded-[10px] text-[0.8125rem] flex items-center gap-1 hover:bg-[#2f6b29] transition-colors"
          >
            <Plus size={16} />
            Nova Mensagem
          </button>
        </div>

        {/* Lista de mensagens */}
        {messages.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-[16px] shadow-sm">
            <Mail className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
            <p className="text-slate-500 dark:text-slate-400 text-[0.875rem]">
              Ainda não há mensagens
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-[0.75rem] mt-1">
              Clique em "Nova Mensagem" para enviar a primeira
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`bg-white dark:bg-slate-800 rounded-[16px] p-4 shadow-sm transition-all ${
                  isIncoming(message) && !message.isRead 
                    ? 'border-2 border-orange-400 dark:border-orange-500' 
                    : 'border-2 border-transparent hover:border-[#3b8433]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Conteúdo clicável da mensagem */}
                  <div
                    onClick={() => handleViewMessage(message)}
                    className="flex-1 cursor-pointer"
                  >
                    {/* Nome do Formando em destaque para o Formador */}
                    {isFormador && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-[0.625rem] font-medium">
                          {message.formandoName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-[0.8125rem] font-semibold text-slate-800 dark:text-slate-100">
                            {message.formandoName}
                          </p>
                          <p className="text-[0.625rem] text-slate-400 dark:text-slate-500">
                            {message.sentBy === 'formando' ? 'Mensagem recebida' : 'Mensagem enviada'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[0.9375rem] font-medium text-slate-800 dark:text-slate-100">
                        {message.title}
                      </h4>
                      {isIncoming(message) && !message.isRead && (
                        <span className="bg-orange-500 text-white text-[0.625rem] px-2 py-0.5 rounded-full">
                          Nova
                        </span>
                      )}
                    </div>
                    <p className="text-[0.75rem] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                      {message.message}
                    </p>
                    <div className="flex items-center gap-3 text-[0.6875rem] text-slate-400 dark:text-slate-500">
                      <span>{formatDate(message.createdAt)}</span>
                      {message.editedAt && (
                        <>
                          <span>•</span>
                          <span className="text-blue-500">Editada</span>
                        </>
                      )}
                      {!isFormador && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {message.sentBy === 'formador' ? `De: ${message.formadorName}` : 'Enviada por si ao formador'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Botões de ação: o formador gere todas; o formando apaga as que enviou */}
                  {(isFormador || message.sentBy === 'formando') && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Botão Editar - aparece apenas para mensagens ENVIADAS pelo formador */}
                      {isFormador && message.sentBy === 'formador' && (
                        <button
                          type="button"
                          onClick={() => openEditModal(message)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                          aria-label="Editar mensagem"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      
                      {/* Botão Apagar - aparece para todas as mensagens */}
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        aria-label="Apagar mensagem"
                        title="Apagar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog - Criar Mensagem */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[550px] bg-white dark:bg-slate-800 rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100 text-[1.125rem] flex items-center gap-2">
              <Mail className="text-[#3b8433]" size={22} />
              Nova Mensagem
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400 text-[0.8125rem]">
              {isFormador 
                ? 'Selecione um formando e escreva sua mensagem' 
                : 'Escreva uma mensagem para o formador'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            {/* Seleção de Formando - APENAS PARA FORMADORES */}
            {isFormador && (
              <div className="grid gap-2">
                <Label className="dark:text-slate-200 text-[0.875rem] font-medium">
                  Destinatário <span className="text-red-500">*</span>
                </Label>
                
                {loadingStudents ? (
                  <div className="flex items-center justify-center py-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3b8433]"></div>
                    <span className="ml-2 text-[0.8125rem] text-slate-500 dark:text-slate-400">
                      A carregar...
                    </span>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-[0.8125rem] text-slate-500 dark:text-slate-400">
                      Nenhum formando encontrado
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {students.map((student) => {
                      const isSelected = selectedFormandoId === student.id;
                      const initials = student.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2);
                      
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setSelectedFormandoId(student.id)}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? 'border-[#3b8433] bg-green-50 dark:bg-green-900/20'
                              : 'border-slate-200 dark:border-slate-600 hover:border-[#3b8433]/50 bg-white dark:bg-slate-700/30'
                          }`}
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-[0.6875rem] font-medium">
                            {initials}
                          </div>
                          <div className="flex-1">
                            <p className={`text-[0.8125rem] font-medium ${
                              isSelected 
                                ? 'text-[#3b8433] dark:text-green-400' 
                                : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {student.name}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 bg-[#3b8433] rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Para formandos: mostrar destinatário fixo */}
            {!isFormador && (
              <div className="grid gap-2">
                <Label className="dark:text-slate-200 text-[0.875rem] font-medium">
                  Para
                </Label>
                
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-[0.6875rem] font-medium">
                    F
                  </div>
                  <p className="text-[0.8125rem] font-medium text-slate-800 dark:text-slate-200">
                    Formador
                  </p>
                </div>
              </div>
            )}

            {/* Título */}
            <div className="grid gap-2">
              <Label htmlFor="title" className="dark:text-slate-200 text-[0.875rem] font-medium">
                Assunto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ex: Dúvida sobre Sprint Planning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 text-[0.875rem] h-10"
                maxLength={100}
                required
              />
            </div>
            
            {/* Mensagem */}
            <div className="grid gap-2">
              <Label htmlFor="message" className="dark:text-slate-200 text-[0.875rem] font-medium">
                Mensagem <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Escreva a sua mensagem aqui..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="min-h-[120px] dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 text-[0.875rem] resize-none"
                maxLength={500}
                required
              />
              <p className="text-[0.6875rem] text-slate-400 dark:text-slate-500 text-right">
                {messageText.length}/500
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                setIsCreateOpen(false);
                setTitle('');
                setMessageText('');
                setSelectedFormandoId('');
              }}
              className="dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={handleCreateMessage} 
              className="bg-[#3b8433] hover:bg-[#2f6b29] text-white flex items-center gap-2"
              disabled={!title.trim() || !messageText.trim() || (isFormador && !selectedFormandoId) || messageText.length < 10}
            >
              <MessageSquare size={16} />
              Enviar Mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Editar Mensagem */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-800 rounded-xl">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">Editar Mensagem</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Atualize a mensagem enviada ao formando.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-formando" className="dark:text-slate-200">
                Destinatário <span className="text-red-500">*</span>
              </Label>
              {loadingStudents ? (
                <div className="text-[0.875rem] text-slate-400 py-2 px-3">
                  A carregar formandos...
                </div>
              ) : (
                <select
                  id="edit-formando"
                  value={selectedFormandoId}
                  onChange={(e) => setSelectedFormandoId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b8433] focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Selecione um formando</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-title" className="dark:text-slate-200">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                placeholder="Ex: Feedback sobre Sprint 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                maxLength={100}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-message" className="dark:text-slate-200">
                Mensagem <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-message"
                placeholder="Escreva a sua mensagem..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="min-h-[150px] dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                maxLength={1000}
                required
              />
              <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 text-right">
                {messageText.length}/1000 caracteres
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditOpen(false)}
              className="dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateMessage} 
              className="bg-[#3b8433] hover:bg-[#2f6b29] text-white"
              disabled={!title.trim() || !messageText.trim() || !selectedFormandoId}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Visualizar Mensagem */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-800 rounded-xl">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">{selectedMessage?.title}</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              {selectedMessage?.sentBy === 'formando'
                ? (isFormador ? `Mensagem de ${selectedMessage?.formandoName}` : 'Mensagem enviada por si ao formador')
                : (isFormador ? `Mensagem enviada para ${selectedMessage?.formandoName}` : `Mensagem de ${selectedMessage?.formadorName}`)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
              <p className="text-[0.875rem] text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                {selectedMessage?.message}
              </p>
            </div>
            <div className="text-[0.6875rem] text-slate-500 dark:text-slate-400 space-y-1">
              <p>Enviada em: {selectedMessage && new Date(selectedMessage.createdAt).toLocaleString('pt-PT')}</p>
              {selectedMessage?.editedAt && (
                <p>Última edição: {selectedMessage && new Date(selectedMessage.editedAt!).toLocaleString('pt-PT')}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setIsViewOpen(false)}
              className="bg-[#3b8433] hover:bg-[#2f6b29] text-white w-full"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
