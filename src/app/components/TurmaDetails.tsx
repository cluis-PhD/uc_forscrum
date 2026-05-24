import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Users as UsersIcon,
  Plus,
  Edit,
  Trash2,
  Mail,
  Award,
  TrendingUp,
  X,
  Layers
} from 'lucide-react';
import { toast } from "sonner";
import { Header } from './shared/Header';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Sprint {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'planned';
  progress: number;
  storiesCount: number;
  teamId?: string;
}

// Interface para definir a estrutura de uma equipa
interface Team {
  id: string;
  name: string;
  courseId: string;
  members?: Member[];
  performance?: number;
  completedStories?: number;
  sprints?: Sprint[];
}

// Interface para definir a estrutura de um membro da equipa
interface Member {
  id: string;
  name: string;
  email: string;
  teamId: string;
  courseId?: string; // Adicionar courseId
  avatar?: string;
  performance?: number;
  role?: 'Formando' | 'Chefe de Equipa';
}

interface TurmaDetailsProps {
  onBack: () => void;
  courseName?: string; // Nome do curso (opcional, com fallback)
  onNavigate?: (screen: string) => void;
  teamId?: string | null;
  courseId?: string | null;
}

export function TurmaDetails({ onBack, courseName = 'forScrum', onNavigate, teamId, courseId }: TurmaDetailsProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<Member[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [selectedTeamForAction, setSelectedTeamForAction] = useState<Team | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'Formando' | 'Chefe de Equipa'>('Formando');

  // Carregar dados da base de dados
  useEffect(() => {
    loadAllData();
  }, [courseId]);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Carregar teams FILTRADAS por courseId
      const teamsUrl = courseId 
        ? `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams?courseId=${courseId}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams`;
      
      const teamsResponse = await fetch(teamsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        if (teamsData.success && Array.isArray(teamsData.teams)) {
          setTeams(teamsData.teams);
          console.log(`[TurmaDetails] Equipas carregadas para curso ${courseId}:`, teamsData.teams.length);
        }
      }

      // Carregar students FILTRADOS por courseId
      const studentsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/students`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        if (studentsData.success && Array.isArray(studentsData.students)) {
          // Filtrar apenas estudantes do curso atual
          const filteredStudents = courseId
            ? studentsData.students.filter((s: Member) => s.courseId === courseId)
            : studentsData.students;
          setStudents(filteredStudents);
          console.log(`[TurmaDetails] Estudantes carregados para curso ${courseId}:`, filteredStudents.length);
        }
      }

      // Carregar sprints FILTRADOS por courseId
      const sprintsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/sprints`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (sprintsResponse.ok) {
        const sprintsData = await sprintsResponse.json();
        if (sprintsData.success && Array.isArray(sprintsData.sprints)) {
          setSprints(sprintsData.sprints);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Chefe de Equipa': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Formando': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600 dark:text-green-400';
    if (performance >= 75) return 'text-blue-600 dark:text-blue-400';
    if (performance >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'active': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'planned': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'active': return 'Ativo';
      case 'planned': return 'Planeado';
      default: return status;
    }
  };

  const handleAddMember = (team: Team) => {
    setSelectedTeamForAction(team);
    setShowAddMemberModal(true);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeamForAction(team);
    setEditingTeamName(team.name);
    setShowEditTeamModal(true);
  };

  const saveNewMember = () => {
    if (!selectedTeamForAction) return;
    if (!newMemberName || !newMemberEmail) {
      toast.error("Preencha todos os campos");
      return;
    }

    const newMember: Member = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMemberName,
      email: newMemberEmail,
      teamId: selectedTeamForAction.id,
      avatar: newMemberName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      performance: 0,
      role: newMemberRole
    };

    setTeams(teams.map(t => {
      if (t.id === selectedTeamForAction.id) {
        return { ...t, members: [...t.members || [], newMember] };
      }
      return t;
    }));
    
    setShowAddMemberModal(false);
    toast.success("Membro adicionado com sucesso!");
  };

  const saveTeamEdit = async () => {
    if (!selectedTeamForAction) return;
    if (!editingTeamName) {
      toast.error("O nome da equipa não pode estar vazio");
      return;
    }

    try {
      // Fazer PUT request ao backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/teams/${selectedTeamForAction.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editingTeamName,
            members: selectedTeamForAction.members || [],
            courseId: selectedTeamForAction.courseId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro ao atualizar equipa:', errorData);
        throw new Error(errorData.error || 'Erro ao atualizar equipa');
      }

      const data = await response.json();
      console.log('Equipa atualizada no backend:', data);

      // Atualizar lista local
      setTeams(teams.map(t => {
        if (t.id === selectedTeamForAction.id) {
          return { ...t, name: editingTeamName };
        }
        return t;
      }));

      setShowEditTeamModal(false);
      toast.success("✅ Equipa atualizada com sucesso!");
    } catch (error) {
      console.error('Erro ao atualizar equipa:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar equipa');
    }
  };

  // Filtrar equipas se teamId for fornecido
  const displayTeams = teamId ? teams.filter(t => t.id === teamId) : teams;
  
  // Associar membros às equipas
  const teamsWithMembers = displayTeams.map(team => {
    const teamMembers = students.filter(s => s.teamId === team.id);
    const teamSprints = sprints.filter(s => s.teamId === team.id);
    
    // Calcular performance média dos membros
    const avgPerformance = teamMembers.length > 0
      ? Math.round(teamMembers.reduce((sum, m) => sum + (m.performance || 0), 0) / teamMembers.length)
      : 0;
    
    return {
      ...team,
      members: teamMembers,
      sprints: teamSprints,
      performance: avgPerformance,
      completedStories: 0 // TODO: calcular baseado nas stories
    };
  });
  
  // Obter dados da equipa selecionada para métricas
  const selectedTeam = teamId ? teamsWithMembers.find(t => t.id === teamId) : null;

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 pt-[100px] dark:bg-slate-900 transition-colors duration-200">
      {/* Header Fixo */}
      <Header 
        title={teamId ? 'Detalhes da Equipa' : courseName} 
        onBack={onBack} 
        showProfile={false}
      />

      {/* Main Content */}
      <div className="w-full max-w-md mx-auto px-6 pt-6 pb-6 space-y-4">
        {/* Stats da equipa específica quando teamId está definido */}
        {teamId && selectedTeam && (
          <>
            {/* Card com informações gerais da equipa */}
            <div className="bg-gradient-to-br from-[#4aa540] to-[#3d8935] rounded-[16px] p-4 shadow-lg text-white">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white/80 text-[11px] mb-1">Equipa</p>
                  <h2 className="text-[18px] mb-1">{selectedTeam.name}</h2>
                  <p className="text-white/90 text-[12px]">{selectedTeam.members?.length || 0} membros ativos</p>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white border-2 border-white/30">
                  <UsersIcon size={22} />
                </div>
              </div>
              
              {/* Barra de progresso da equipa */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-white/80">Performance Geral</span>
                  <span className="text-white font-medium">{selectedTeam.performance}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5">
                  <div 
                    className="bg-white h-2.5 rounded-full transition-all shadow-lg" 
                    style={{ width: `${selectedTeam.performance}%` }}
                  ></div>
                </div>
              </div>

              {/* Métricas da equipa */}
              <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-white/20">
                <div>
                  <p className="text-white/70 text-[10px] mb-0.5">Stories</p>
                  <p className="text-[16px]">{selectedTeam.completedStories}</p>
                  <p className="text-white/70 text-[9px]">Concluídas</p>
                </div>
                <div>
                  <p className="text-white/70 text-[10px] mb-0.5">Sprints</p>
                  <p className="text-[16px]">{selectedTeam.sprints?.length || 0}</p>
                  <p className="text-white/70 text-[9px]">Total</p>
                </div>
                <div>
                  <p className="text-white/70 text-[10px] mb-0.5">Média</p>
                  <p className="text-[16px]">
                    {selectedTeam.members && selectedTeam.members.length > 0
                      ? Math.round(selectedTeam.members.reduce((sum, m) => sum + (m.performance || 0), 0) / selectedTeam.members.length)
                      : 0}%
                  </p>
                  <p className="text-white/70 text-[9px]">Membros</p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Stats gerais da turma - Estatísticas gerais da turma (apenas se não estiver filtrado por equipa) */}
        {!teamId && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-[12px] p-3 text-center shadow-sm dark:bg-slate-800 transition-colors">
              <UsersIcon className="text-[#4aa540] mx-auto mb-1" size={18} />
              <p className="text-slate-800 text-[16px] dark:text-slate-100">20</p>
              <p className="text-slate-500 text-[12px] dark:text-slate-400">Formandos</p>
            </div>
            <div className="bg-white rounded-[12px] p-3 text-center shadow-sm dark:bg-slate-800 transition-colors">
              <Award className="text-[#4aa540] mx-auto mb-1" size={18} />
              <p className="text-slate-800 text-[16px] dark:text-slate-100">85%</p>
              <p className="text-slate-500 text-[12px] dark:text-slate-400">Média Turma</p>
            </div>
            <div className="bg-white rounded-[12px] p-3 text-center shadow-sm dark:bg-slate-800 transition-colors">
              <TrendingUp className="text-[#4aa540] mx-auto mb-1" size={18} />
              <p className="text-slate-800 text-[16px] dark:text-slate-100">36</p>
              <p className="text-slate-500 text-[12px] dark:text-slate-400">Stories Done</p>
            </div>
          </div>
        )}

        {/* Botão criar nova equipa - esconder se estiver vendo uma equipa específica */}
        {!teamId && (
          <button
            onClick={() => onNavigate?.('createTeam')}
            className="w-full bg-white text-[#4aa540] border-2 border-[#4aa540] rounded-[14px] p-4 shadow-sm hover:shadow-md hover:bg-[#4aa540] hover:text-white transition-all flex items-center justify-center gap-2 group dark:bg-slate-800 dark:text-[#4aa540] dark:border-[#4aa540] dark:hover:bg-[#4aa540] dark:hover:text-white"
          >
            <Plus size={20} strokeWidth={2.5} className="text-[#4aa540] group-hover:text-white transition-colors" />
            <span className="text-[15px] font-medium">Criar Nova Equipa</span>
          </button>
        )}

        <h2 className="text-[18px] text-slate-800 mt-4 dark:text-slate-200">
          {teamId ? 'Detalhes da Equipa' : `Equipas (${teams.length})`}
        </h2>

        {/* Cards das equipas */}
        <div className="space-y-4">
          {teamsWithMembers.map((team) => (
            <div key={team.id} className="bg-white rounded-[16px] p-4 shadow-sm h-full dark:bg-slate-800 transition-colors">
              {/* Team Header - cabeçalho da equipa sem menu de 3 pontos */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#4aa540] to-[#3d8935] p-2 rounded-full">
                    <UsersIcon className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-[16px] text-slate-800 dark:text-slate-100">{team.name}</h3>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">{team.members?.length || 0} membros</p>
                  </div>
                </div>
              </div>

              {/* Team Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 rounded-[12px] dark:bg-slate-700/50">
                <div>
                  <p className="text-[11px] text-slate-500 mb-1 dark:text-slate-400">Performance</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2 dark:bg-slate-600">
                      <div 
                        className="bg-[#4aa540] h-2 rounded-full transition-all"
                        style={{ width: `${team.performance}%` }}
                      />
                    </div>
                    <span className={`text-[13px] ${getPerformanceColor(team.performance)}`}>
                      {team.performance}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 mb-1 dark:text-slate-400">Stories Concluídas</p>
                  <p className="text-[16px] text-slate-800 dark:text-slate-100">{team.completedStories}</p>
                </div>
              </div>

              {/* Team Members */}
              <div className="space-y-2">
                <p className="text-[12px] text-slate-600 mb-2 dark:text-slate-400">Membros:</p>
                {team.members?.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => toast.info(`Ver perfil de ${member.name}`)}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-[10px] transition-colors dark:hover:bg-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[12px]">
                        {member.avatar}
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] text-slate-800 dark:text-slate-200">{member.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${getRoleColor(member.role || 'Formando')} px-2 py-1 rounded-[6px] text-[10px]`}>
                        {member.role || 'Formando'}
                      </span>
                      <span className={`text-[12px] ${getPerformanceColor(member.performance || 0)}`}>
                        {member.performance || 0}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Team Sprints */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-[12px] text-slate-600 mb-2 dark:text-slate-400">Sprints da Equipa:</p>
                <div className="space-y-2">
                  {team.sprints?.map((sprint) => (
                    <div 
                      key={sprint.id}
                      className="bg-slate-50 p-3 rounded-[12px] dark:bg-slate-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-slate-400 dark:text-slate-300" />
                          <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200">{sprint.name}</span>
                        </div>
                        <span className={`${getStatusColor(sprint.status)} px-2 py-0.5 rounded-[6px] text-[10px]`}>
                          {getStatusLabel(sprint.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 mb-2 dark:text-slate-400">
                        <span>{sprint.storiesCount} stories</span>
                        <span>{sprint.progress}% concluído</span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-600">
                        <div 
                          className="bg-[#4aa540] h-1.5 rounded-full transition-all" 
                          style={{ width: `${sprint.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                {/*<button
                  onClick={() => handleAddMember(team)}
                  className="flex-1 py-2 px-2 bg-[#4aa540] text-white rounded-[8px] text-[12px] hover:bg-[#3d8935] transition-colors flex items-center justify-center gap-1"
                >
                  <Plus size={14} />
                  <span>Membro</span>
                </button> 
                <button
                  onClick={() => handleEditTeam(team)}
                  className="flex-1 py-2 px-2 border-2 border-slate-200 text-slate-700 rounded-[8px] text-[12px] hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Edit size={14} />
                  <span>Editar</span>
                </button> */}
              </div>
            </div>
          ))}
        </div>

        <div className="pb-8" />
      </div>

      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Papel
              </Label>
              <Select 
                value={newMemberRole} 
                onValueChange={(value) => setNewMemberRole(value as any)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Formando">Formando</SelectItem>
                  <SelectItem value="Chefe de Equipa">Chefe de Equipa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberModal(false)}>Cancelar</Button>
            <Button onClick={saveNewMember} className="bg-[#4aa540] hover:bg-[#3d8935]">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditTeamModal} onOpenChange={setShowEditTeamModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Equipa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teamName" className="text-right">
                Nome
              </Label>
              <Input
                id="teamName"
                value={editingTeamName}
                onChange={(e) => setEditingTeamName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setShowEditTeamModal(false)}>Cancelar</Button>
            <Button onClick={saveTeamEdit} className="bg-[#4aa540] hover:bg-[#3d8935]">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
