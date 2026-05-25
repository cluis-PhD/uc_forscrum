import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Eye, EyeOff, RotateCcw, Save, ChevronDown, Trophy, CheckCircle } from 'lucide-react';
import { toast } from "sonner";
import { mockAPI } from '../utils/supabase/mock-api';
import { useApp } from '../context/AppContext';
import { Header } from './shared/Header';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ScrumPokerProps {
  onBack: () => void;
}

type VotingSystem = 'fibonacci' | 'tshirt';

type Vote = string | null;

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  vote: Vote;
  hasVoted: boolean;
}

interface UserStory {
  id: string;
  title: string;
  description?: string;
  points?: number;
  courseId?: string;
  sprintId?: string;
  status?: string;
}

export function ScrumPoker({ onBack }: ScrumPokerProps) {
  const { userType, userProfile, selectedUserStory, selectedCourse, loggedStudent, setSelectedUserStory } = useApp();
  
  const primaryColor = userType === 'formando' ? '#0b87ac' : '#4aa540';
  
  const [votingSystem, setVotingSystem] = useState<VotingSystem>('fibonacci');
  
  const [selectedVote, setSelectedVote] = useState<Vote>(null);
  
  const [votesRevealed, setVotesRevealed] = useState(false);
  
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [showStorySelector, setShowStorySelector] = useState(false);

  const fibonacciOptions = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'];
  
  const tshirtOptions = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'];

  const votingOptions = votingSystem === 'fibonacci' ? fibonacciOptions : tshirtOptions;

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadUserStories();
  }, [selectedCourse, loggedStudent]);

  useEffect(() => {
    if (userProfile.name) {
      loadTeamMembers();
    }
  }, [userProfile.name]);

  useEffect(() => {
    if (!currentStoryId || votesRevealed) return;
    
    // Iniciar polling
    const interval = setInterval(() => {
      syncVotesFromBackend();
    }, 3000); // A cada 3 segundos
    
    setPollingInterval(interval);
    
    // Limpar polling quando o componente desmontar ou os votos forem revelados
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStoryId, votesRevealed]);

  const syncVotesFromBackend = async () => {
    if (!currentStoryId) return;
    
    try {
      // Primeiro tentar ler do localStorage (sincronização local)
      const votesKey = `scrumpoker_votes_${currentStoryId}`;
      const localVotes = JSON.parse(localStorage.getItem(votesKey) || '[]');
      
      if (localVotes.length > 0) {
        console.log('[ScrumPoker] Votos sincronizados do localStorage:', localVotes);
        
        // Atualizar votos dos membros com base no localStorage
        setTeamMembers(prev => prev.map(member => {
          const vote = localVotes.find((v: any) => 
            v.userId === member.id || v.userName === member.name
          );
          
          if (vote) {
            return {
              ...member,
              vote: vote.vote,
              hasVoted: true,
            };
          }
          return member;
        }));
        return;
      }
      
      // Se localStorage estiver vazio, tentar backend (quando implementado)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/votes?storyId=${currentStoryId}`,
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
        
        if (data.success && Array.isArray(data.votes)) {
          console.log('[ScrumPoker] Votos sincronizados do backend:', data.votes);
          
          // Atualizar votos dos membros
          setTeamMembers(prev => prev.map(member => {
            const vote = data.votes.find((v: any) => v.userId === member.id || v.userName === member.name);
            if (vote) {
              return {
                ...member,
                vote: vote.vote,
                hasVoted: true,
              };
            }
            return member;
          }));
        }
      }
    } catch (error) {
      console.log('[ScrumPoker] Erro ao sincronizar votos (silencioso):', error);
      // Erro silencioso - não interrompe a experiência do utilizador
    }
  };

  const loadUserStories = async () => {
    try {
      setLoadingStories(true);
      
      console.log('[ScrumPoker] 🔄 Carregando user stories...');
      
      let data: any = null;
      let success = false;
      
      // Tentar backend primeiro
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          data = await response.json();
          success = true;
          console.log('[ScrumPoker] ✅ Stories recebidas do backend');
        }
      } catch (fetchError) {
        console.log('[ScrumPoker] ⚠️ Backend não disponível, usando Mock API...');
      }
      
      // Se backend falhou, usar Mock API
      if (!success) {
        console.log('[ScrumPoker] 🔄 Fallback para Mock API...');
        const result = await mockAPI.getStories();
        
        if (result.success) {
          data = result;
          success = true;
          console.log('[ScrumPoker] ✅ Stories recebidas do Mock API');
        }
      }
      
      console.log('[ScrumPoker] selectedCourse:', selectedCourse);
      console.log('[ScrumPoker] loggedStudent:', loggedStudent);
      console.log('[ScrumPoker] Todas as stories recebidas:', data?.stories);
      
      if (success && data?.success && Array.isArray(data.stories)) {
        // Filtrar stories do curso atual - usar loggedStudent.courseId como fallback
        const courseIdToFilter = selectedCourse?.id || loggedStudent?.courseId;
        console.log('[ScrumPoker] Filtrando por courseId:', courseIdToFilter);
        
        // ✅ CORREÇÃO: Filtrar por curso E equipa (formandos só vêem stories da sua equipa)
        let filteredStories = data.stories.filter((story: any) => 
          story.courseId === courseIdToFilter
        );
        
        // ✅ Para FORMANDOS: filtrar também por equipa
        if (userType === 'formando' && loggedStudent?.teamName) {
          console.log('[ScrumPoker] Filtrando por teamName:', loggedStudent.teamName);
          filteredStories = filteredStories.filter((story: any) => {
            // Stories SEM equipa atribuída são visíveis para todos
            // Stories COM equipa específica só são visíveis para membros dessa equipa
            return !story.team || story.team.trim() === '' || story.team === loggedStudent.teamName;
          });
        }
        
        console.log('[ScrumPoker] 📋 Stories filtradas:', filteredStories);
        setUserStories(filteredStories);
        
        // Se não houver story selecionada, selecionar a primeira
        if (filteredStories.length > 0 && !currentStoryId) {
          setCurrentStoryId(filteredStories[0].id);
        }
        
        // ⭐ CORREÇÃO IMPORTANTE: Atualizar selectedUserStory no contexto
        if (currentStoryId) {
          const updatedStory = filteredStories.find((s: any) => s.id === currentStoryId);
          if (updatedStory) {
            console.log('[ScrumPoker] 🎯 Story selecionada atualizada:', updatedStory);
            console.log('[ScrumPoker] 🎯 Pontos da story:', updatedStory.points);
            
            // ✅ SEMPRE atualizar o contexto com a story mais recente
            setSelectedUserStory(updatedStory);
          }
        }
      }
    } catch (error) {
      console.error('[ScrumPoker] ❌ Erro ao carregar user stories:', error);
      toast.error('Erro ao carregar user stories');
    } finally {
      setLoadingStories(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      setLoadingTeam(true);
      
      // Se for formando, carregar os membros da equipa
      if (userType === 'formando' && loggedStudent?.teamId) {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/students`,
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
            
            if (data.success && Array.isArray(data.students)) {
              // Filtrar apenas formandos da mesma equipa e remover duplicados
              const uniqueStudents = new Map();
              
              data.students
                .filter((student: any) => student.teamId === loggedStudent.teamId)
                .forEach((student: any) => {
                  // Usar o ID como chave para garantir unicidade
                  if (!uniqueStudents.has(student.id)) {
                    uniqueStudents.set(student.id, {
                      id: student.id,
                      name: student.name,
                      avatar: student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                      vote: null,
                      hasVoted: false,
                    });
                  }
                });
              
              const teamMembers = Array.from(uniqueStudents.values());
              setTeamMembers(teamMembers);
              console.log('[ScrumPoker] Membros da equipa carregados (únicos):', teamMembers);
              return;
            }
          }
        } catch (fetchError) {
          console.log('[ScrumPoker] Backend não disponível, usando Mock API...');
        }
        
        // Fallback para Mock API
        const result = await mockAPI.getStudents();
        
        if (result.success) {
          const uniqueStudents = new Map();
          
          result.students
            .filter((student: any) => student.teamId === loggedStudent.teamId)
            .forEach((student: any) => {
              if (!uniqueStudents.has(student.id)) {
                uniqueStudents.set(student.id, {
                  id: student.id,
                  name: student.name,
                  avatar: student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                  vote: null,
                  hasVoted: false,
                });
              }
            });
          
          const teamMembers = Array.from(uniqueStudents.values());
          setTeamMembers(teamMembers);
          console.log('[ScrumPoker] Membros da equipa carregados do Mock API:', teamMembers);
        }
      } else {
        // Se for formador, criar lista com apenas o formador
        setTeamMembers([{
          id: '1',
          name: userProfile.name,
          avatar: userProfile.avatar,
          vote: selectedVote,
          hasVoted: selectedVote !== null,
        }]);
      }
    } catch (error) {
      console.error('Erro ao carregar membros da equipa:', error);
      toast.error('Erro ao carregar membros da equipa');
      // Fallback para dados simulados em caso de erro
      setTeamMembers([{
        id: '1',
        name: userProfile.name,
        avatar: userProfile.avatar,
        vote: selectedVote,
        hasVoted: selectedVote !== null,
      }]);
    } finally {
      setLoadingTeam(false);
    }
  };

  const currentStory = userStories.find(s => s.id === currentStoryId);
  
  useEffect(() => {
    if (currentStory) {
      console.log('[ScrumPoker] Current Story atualizada:', {
        id: currentStory.id,
        title: currentStory.title,
        points: currentStory.points
      });
    }
  }, [currentStory?.points, currentStoryId]);

  const handleVote = async (value: string) => {
    setSelectedVote(value);
    // Atualizar o voto do utilizador atual na lista de membros
    setTeamMembers(prev => prev.map(member => {
      // Encontrar o membro atual baseado no nome
      if (member.name === userProfile.name) {
        return { ...member, vote: value, hasVoted: true };
      }
      return member;
    }));
    
    // Salvar voto no backend
    await saveVoteToBackend(value);
    
    toast.success('Voto registado!');
  };

  const saveVoteToBackend = async (voteValue: string) => {
    if (!currentStoryId) return;
    
    try {
      console.log('[ScrumPoker] Salvando voto:', {
        storyId: currentStoryId,
        userId: loggedStudent?.id || userProfile.name,
        userName: userProfile.name,
        vote: voteValue,
        votingSystem
      });

      // Salvar voto no localStorage (sincronização local entre abas)
      const votesKey = `scrumpoker_votes_${currentStoryId}`;
      const existingVotes = JSON.parse(localStorage.getItem(votesKey) || '[]');
      
      // Remover voto anterior deste utilizador
      const updatedVotes = existingVotes.filter((v: any) => v.userId !== (loggedStudent?.id || userProfile.name));
      
      // Adicionar novo voto
      updatedVotes.push({
        storyId: currentStoryId,
        userId: loggedStudent?.id || userProfile.name,
        userName: userProfile.name,
        vote: voteValue,
        votingSystem,
        timestamp: Date.now()
      });
      
      localStorage.setItem(votesKey, JSON.stringify(updatedVotes));
      console.log('[ScrumPoker] Voto salvo no localStorage:', updatedVotes);
      
    } catch (error) {
      console.error('[ScrumPoker] ❌ Erro ao salvar voto:', error);
      toast.error('Erro ao salvar voto. Tente novamente.');
    }
  };

  const handleRevealVotes = async () => {
    setVotesRevealed(true);
    toast.success('Votos revelados!');
    
    // ✅ CORREÇÃO: Calcular e salvar IMEDIATAMENTE após revelar
    // Usar Promise para garantir que o estado foi atualizado
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const consensus = getVoteConsensus();
    if (consensus) {
      const averagePoints = Math.round(parseFloat(consensus.avg));
      console.log('[ScrumPoker] 💾 Auto-salvando média:', averagePoints, 'pontos');
      
      // Salvar automaticamente sem toast (silencioso)
      await saveEstimateToBackend(averagePoints, true);
    } else {
      console.log('[ScrumPoker] ⚠️ Nenhum consenso calculado - não há votos válidos');
    }
  };

  const handleResetVotes = () => {
    setSelectedVote(null);
    setVotesRevealed(false);
    setTeamMembers(prev => prev.map(member => ({
      ...member,
      vote: null,
      hasVoted: false
    })));
    
    // Limpar votos do localStorage
    if (currentStoryId) {
      const votesKey = `scrumpoker_votes_${currentStoryId}`;
      localStorage.removeItem(votesKey);
    }
    
    toast.info('Votação reiniciada');
  };

  const saveEstimateToBackend = async (points: number, autoSave: boolean = false) => {
    if (!currentStoryId) {
      if (!autoSave) toast.error('Nenhuma story selecionada');
      return;
    }

    try {
      console.log('[ScrumPoker] ========================================');
      console.log('[ScrumPoker] 💾 Iniciando salvamento de estimativa');
      console.log('[ScrumPoker] 📌 Story ID:', currentStoryId);
      console.log('[ScrumPoker] 🎯 Pontos a salvar:', points);
      console.log('[ScrumPoker] 🔕 Auto-save:', autoSave);
      
      let success = false;
      let savedStory = null;
      
      // Tentar backend primeiro
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1184b871/stories/${currentStoryId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ points }),
          }
        );

        console.log('[ScrumPoker] 📡 Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('[ScrumPoker] 📦 Dados retornados:', data);
          
          if (data.success && data.story) {
            success = true;
            savedStory = data.story;
            console.log('[ScrumPoker] ✅ Estimativa salva no backend!');
          }
        }
      } catch (fetchError) {
        console.log('[ScrumPoker] ⚠️ Backend não disponível, usando Mock API...');
      }
      
      // ✅ Se backend falhou, usar Mock API
      if (!success) {
        console.log('[ScrumPoker] 🔄 Fallback para Mock API...');
        const result = await mockAPI.updateStory(currentStoryId, { points });
        
        if (result.success && result.story) {
          success = true;
          savedStory = result.story;
          console.log('[ScrumPoker] ✅ Estimativa salva no Mock API!');
        } else {
          throw new Error(result.error || 'Erro ao salvar estimativa');
        }
      }

      if (success && savedStory) {
        // ✅ 1. Atualizar a lista de stories LOCALMENTE
        setUserStories(prev => {
          const updated = prev.map(story => 
            story.id === currentStoryId 
              ? { ...story, points: savedStory.points } 
              : story
          );
          console.log('[ScrumPoker] 📝 Stories atualizadas localmente');
          return updated;
        });
        
        // ✅ 2. CRÍTICO: Atualizar o contexto GLOBAL com a story completa salva
        console.log('[ScrumPoker] 🔥 ATUALIZANDO CONTEXTO GLOBAL com story salva:', savedStory);
        setSelectedUserStory(savedStory);
        
        // ✅ 3. Recarregar stories para garantir sincronização
        console.log('[ScrumPoker] 🔃 Recarregando stories do backend...');
        await loadUserStories();
        
        if (!autoSave) {
          toast.success(`✅ Estimativa de ${points} pontos salva!`);
        } else {
          console.log('[ScrumPoker] 🎯 Auto-save completado:', points, 'pontos');
        }
        
        console.log('[ScrumPoker] ========================================');
        
        return true; // ✅ Retorna sucesso
      }
      
      return false;
    } catch (error) {
      console.error('[ScrumPoker] ❌ ERRO ao salvar estimativa:', error);
      console.log('[ScrumPoker] ========================================');
      if (!autoSave) toast.error('Erro ao salvar estimativa');
      return false;
    }
  };

  const handleSaveEstimate = async (points: number) => {
    await saveEstimateToBackend(points, false);
  };

  const totalVotes = teamMembers.filter(m => m.hasVoted).length;
  
  const totalMembers = teamMembers.length;
  
  const allVoted = totalVotes === totalMembers;

  const getVoteConsensus = () => {
    if (!votesRevealed) return null;
    
    // Converte votos para números, filtrando votos inválidos
    const numericVotes = teamMembers
      .map(m => m.vote)
      .filter(v => v && v !== '?' && v !== '☕')
      .map(v => {
        // Converte tamanhos de T-Shirt para números equivalentes
        if (votingSystem === 'tshirt') {
          const sizeMap: Record<string, number> = { 
            'XXS': 1, 'XS': 2, 'S': 3, 'M': 5, 'L': 8, 'XL': 13, 'XXL': 21 
          };
          return sizeMap[v!] || 0;
        }
        return parseInt(v!);
      });

    // Retorna null se não houver votos válidos
    if (numericVotes.length === 0) return null;

    // Calcula estatísticas
    const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
    const min = Math.min(...numericVotes);
    const max = Math.max(...numericVotes);
    
    return { avg: avg.toFixed(1), min, max };
  };

  const calculateConsensus = getVoteConsensus();

  return (
    <div className="bg-[#f0f0f0] min-h-screen w-full font-['Roboto',-apple-system,BlinkMacSystemFont,sans-serif] pb-24 dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <Header 
        title="Scrum Poker" 
        onBack={onBack} 
        showProfile={false}
      />

      {/* Main Content */}
      <div className="max-w-[390px] mx-auto px-6 pt-[120px] pb-6 space-y-5">
        {/* Story Being Voted */}
        <div 
          className="rounded-[16px] p-5 shadow-sm text-white"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${userType === 'formando' ? '#096d8a' : '#3d8935'} 100%)`
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <p className="text-white/80 text-[12px]">User Story em Votação</p>
            {currentStory?.points && currentStory.points > 0 && (
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle size={14} />
                <span className="text-[13px] font-medium">{currentStory.points} pts</span>
              </div>
            )}
          </div>
          
          {/* Story Selector */}
          <div className="relative mb-4">
            <button
              onClick={() => setShowStorySelector(!showStorySelector)}
              className="w-full text-left bg-white/10 hover:bg-white/20 rounded-[12px] px-4 py-3 transition-colors flex items-center justify-between"
              aria-label="Selecionar User Story"
              aria-expanded={showStorySelector}
            >
              <span className="text-[16px] flex-1 pr-2">
                {loadingStories ? 'Carregando...' : (currentStory?.title || 'Selecione uma story')}
              </span>
              <ChevronDown 
                size={20} 
                className={`transition-transform ${showStorySelector ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown com lista de stories */}
            {showStorySelector && userStories.length > 0 && (
              <>
                {/* Overlay para fechar */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowStorySelector(false)}
                />
                
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[12px] shadow-xl max-h-[300px] overflow-y-auto z-20">
                  {userStories.map((story) => (
                    <button
                      key={story.id}
                      onClick={() => {
                        setCurrentStoryId(story.id);
                        setShowStorySelector(false);
                        handleResetVotes();
                        toast.success(`Story selecionada: ${story.title}`);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0 ${
                        story.id === currentStoryId ? 'bg-slate-100' : ''
                      }`}
                    >
                      <p className="text-[14px] text-slate-800">{story.title}</p>
                      {story.description && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{story.description}</p>
                      )}
                      {story.points && story.points > 0 && (
                        <p className="text-[11px] text-green-600 mt-1">✓ {story.points} pontos</p>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/20">
            <div className="flex items-center gap-2 text-[13px]">
              <Users size={16} />
              <span>{totalVotes}/{totalMembers} votaram</span>
            </div>
            {allVoted && !votesRevealed && (
              <div className="flex items-center gap-1.5 bg-green-500/20 px-3 py-1 rounded-full">
                <CheckCircle size={14} />
                <span className="text-[12px]">Todos votaram</span>
              </div>
            )}
          </div>
        </div>

        {/* Voting System Toggle */}
        <div className="bg-white rounded-[16px] p-4 shadow-sm dark:bg-slate-800 transition-colors">
          <p className="text-[13px] text-slate-600 mb-3 dark:text-slate-400" id="voting-system-label">Sistema de Votação</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="voting-system-label">
            <button
              onClick={() => {
                setVotingSystem('fibonacci');
                handleResetVotes();
              }}
              role="radio"
              aria-checked={votingSystem === 'fibonacci'}
              aria-label="Sistema Fibonacci"
              className={`py-3 px-4 rounded-[12px] text-[14px] transition-all ${
                votingSystem === 'fibonacci'
                  ? 'text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
              style={{
                background: votingSystem === 'fibonacci' ? primaryColor : undefined
              }}
            >
              Fibonacci
            </button>
            <button
              onClick={() => {
                setVotingSystem('tshirt');
                handleResetVotes();
              }}
              role="radio"
              aria-checked={votingSystem === 'tshirt'}
              aria-label="Sistema T-Shirt"
              className={`py-3 px-4 rounded-[12px] text-[14px] transition-all ${
                votingSystem === 'tshirt'
                  ? 'text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
              style={{
                background: votingSystem === 'tshirt' ? primaryColor : undefined
              }}
            >
              T-Shirt
            </button>
          </div>
        </div>

        {/* Voting Cards */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800 transition-colors">
          <p className="text-[14px] text-slate-800 mb-4 dark:text-slate-200" id="vote-cards-label">Selecione o seu voto</p>
          <div className="grid grid-cols-4 gap-3" role="group" aria-labelledby="vote-cards-label">
            {votingOptions.map((option) => (
              <button
                key={option}
                onClick={() => handleVote(option)}
                disabled={votesRevealed}
                aria-pressed={selectedVote === option}
                aria-label={`Votar ${option}`}
                className={`aspect-[3/4] rounded-[12px] border-3 transition-all flex items-center justify-center text-[20px] shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedVote === option
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:shadow-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500'
                }`}
                style={{
                  background: selectedVote === option ? primaryColor : undefined,
                  borderColor: selectedVote === option ? primaryColor : undefined,
                  borderWidth: '2px'
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Team Votes */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm dark:bg-slate-800 transition-colors" aria-live="polite">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] text-slate-800 dark:text-slate-200">Votos da Equipa</p>
            {votesRevealed ? (
              <div className="flex items-center gap-1.5 text-green-600 text-[12px] dark:text-green-400">
                <Eye size={14} />
                <span>Revelados</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500 text-[12px] dark:text-slate-400">
                <EyeOff size={14} />
                <span>Ocultos</span>
              </div>
            )}
          </div>

          {loadingTeam ? (
            <div className="text-center py-4 text-slate-500 text-[13px]">Carregando membros...</div>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => {
                const isCurrentUser = member.name === userProfile.name;
                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 rounded-[12px] ${
                      isCurrentUser ? 'bg-blue-50 border-2 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-700'
                    }`}
                    style={{
                      borderColor: isCurrentUser ? primaryColor : 'transparent'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px]"
                        style={{
                          background: isCurrentUser 
                            ? `linear-gradient(135deg, ${primaryColor}, ${userType === 'formando' ? '#096d8a' : '#3d8935'})` 
                            : '#64748b'
                        }}
                      >
                        {member.avatar}
                      </div>
                      <div>
                        <p className="text-[14px] text-slate-800 dark:text-slate-200">{member.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {member.hasVoted ? 'Votou' : 'Aguardando...'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-12 h-16 rounded-[8px] border-2 flex items-center justify-center text-[18px] shadow-sm transition-colors ${votesRevealed && member.vote ? '' : 'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'}`}
                      style={{
                        background: votesRevealed && member.vote ? primaryColor : undefined,
                        borderColor: votesRevealed && member.vote ? primaryColor : undefined,
                        color: votesRevealed && member.vote ? 'white' : undefined
                      }}
                    >
                      {votesRevealed ? (member.vote || '—') : (member.hasVoted ? '?' : '—')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Consensus */}
          {votesRevealed && calculateConsensus && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] text-slate-600 dark:text-slate-400">Estatísticas - Clique para salvar</p>
                {currentStory?.points && currentStory.points > 0 && (
                  <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    <CheckCircle size={12} className="text-green-600 dark:text-green-400" />
                    <span className="text-[11px] text-green-700 dark:text-green-300">
                      {currentStory.points} pts salvos
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleSaveEstimate(calculateConsensus.min)}
                  className={`rounded-[10px] p-3 text-center transition-colors active:scale-95 ${
                    currentStory?.points === calculateConsensus.min
                      ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                      : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                  aria-label={`Salvar estimativa de ${calculateConsensus.min} pontos (mínimo)`}
                >
                  <p className="text-[11px] text-slate-500 mb-1 dark:text-slate-400">Mínimo</p>
                  <p className="text-[18px]" style={{ color: primaryColor }}>{calculateConsensus.min}</p>
                  {currentStory?.points === calculateConsensus.min && (
                    <CheckCircle size={14} className="mx-auto mt-1 text-green-600 dark:text-green-400" />
                  )}
                </button>
                <button
                  onClick={() => handleSaveEstimate(Math.round(parseFloat(calculateConsensus.avg)))}
                  className={`rounded-[10px] p-3 text-center transition-colors active:scale-95 ${
                    currentStory?.points === Math.round(parseFloat(calculateConsensus.avg))
                      ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                      : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                  aria-label={`Salvar estimativa de ${Math.round(parseFloat(calculateConsensus.avg))} pontos (média)`}
                >
                  <p className="text-[11px] text-slate-500 mb-1 dark:text-slate-400">Média</p>
                  <p className="text-[18px]" style={{ color: primaryColor }}>{calculateConsensus.avg}</p>
                  {currentStory?.points === Math.round(parseFloat(calculateConsensus.avg)) && (
                    <CheckCircle size={14} className="mx-auto mt-1 text-green-600 dark:text-green-400" />
                  )}
                </button>
                <button
                  onClick={() => handleSaveEstimate(calculateConsensus.max)}
                  className={`rounded-[10px] p-3 text-center transition-colors active:scale-95 ${
                    currentStory?.points === calculateConsensus.max
                      ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                      : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                  aria-label={`Salvar estimativa de ${calculateConsensus.max} pontos (máximo)`}
                >
                  <p className="text-[11px] text-slate-500 mb-1 dark:text-slate-400">Máximo</p>
                  <p className="text-[18px]" style={{ color: primaryColor }}>{calculateConsensus.max}</p>
                  {currentStory?.points === calculateConsensus.max && (
                    <CheckCircle size={14} className="mx-auto mt-1 text-green-600 dark:text-green-400" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!votesRevealed && (allVoted || selectedVote) && (
            <button
              onClick={handleRevealVotes}
              aria-label="Revelar Votos"
              className="w-full py-4 rounded-[16px] text-white text-[16px] shadow-lg active:scale-[0.98] transition-all"
              style={{ background: primaryColor }}
            >
              <div className="flex items-center justify-center gap-2">
                <Eye size={20} />
                <span>Revelar Votos</span>
              </div>
            </button>
          )}

          {votesRevealed && (
            <button
              onClick={handleResetVotes}
              aria-label="Iniciar Nova Votação"
              className="w-full bg-white border-2 py-4 rounded-[16px] text-[16px] shadow-sm hover:shadow-md active:scale-[0.98] transition-all dark:bg-slate-800 dark:hover:bg-slate-700"
              style={{ 
                borderColor: primaryColor,
                color: primaryColor
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <RotateCcw size={20} />
                <span>Nova Votação</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
