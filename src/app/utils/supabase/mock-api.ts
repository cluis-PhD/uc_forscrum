/**
 * Mock API - Dados de exemplo para desenvolvimento local
 * Ativa automaticamente quando o backend não está disponível
 */

// Mock Data - Dados de exemplo
const mockCourses = [
  {
    id: 'course-1',
    name: 'Curso de Scrum 2026',
    description: 'Curso completo de metodologia Scrum',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    trainer: 'Formador',
    teams: ['team-1', 'team-2'],
    createdAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 'course-2',
    name: 'Agile Avançado',
    description: 'Práticas avançadas de Agile',
    startDate: '2026-02-01',
    endDate: '2026-07-31',
    trainer: 'Formador',
    teams: ['team-3'],
    createdAt: '2026-01-15T10:00:00Z',
  }
];

const mockTeams = [
  {
    id: 'team-1',
    name: 'Equipa Alpha',
    courseId: 'course-1',
    students: ['student-1', 'student-2', 'student-3'],
    sprints: ['sprint-1', 'sprint-2'],
    createdAt: '2026-01-02T10:00:00Z',
  },
  {
    id: 'team-2',
    name: 'Equipa Beta',
    courseId: 'course-1',
    students: ['student-4', 'student-5'],
    sprints: ['sprint-3'],
    createdAt: '2026-01-02T11:00:00Z',
  },
  {
    id: 'team-3',
    name: 'Equipa Gamma',
    courseId: 'course-2',
    students: ['student-6'],
    sprints: [],
    createdAt: '2026-02-01T10:00:00Z',
  }
];

const mockStudents = [
  {
    id: 'student-1',
    name: 'João Silva',
    email: 'joao@example.com',
    teamId: 'team-1',
    courseId: 'course-1',
    password: 'formando',
    avatar: 'J',
    darkMode: false,
    messages: [],
    createdAt: '2026-01-03T10:00:00Z',
  },
  {
    id: 'student-2',
    name: 'Maria Santos',
    email: 'maria@example.com',
    teamId: 'team-1',
    courseId: 'course-1',
    password: 'formando',
    avatar: 'M',
    darkMode: true,
    messages: [],
    createdAt: '2026-01-03T11:00:00Z',
  },
  {
    id: 'student-3',
    name: 'Pedro Costa',
    email: 'pedro@example.com',
    teamId: 'team-1',
    courseId: 'course-1',
    password: 'formando',
    avatar: 'P',
    darkMode: false,
    messages: [],
    createdAt: '2026-01-03T12:00:00Z',
  },
  {
    id: 'student-4',
    name: 'Ana Ferreira',
    email: 'ana@example.com',
    teamId: 'team-2',
    courseId: 'course-1',
    password: 'formando',
    avatar: 'A',
    darkMode: false,
    messages: [],
    createdAt: '2026-01-03T13:00:00Z',
  },
  {
    id: 'student-5',
    name: 'Carlos Sousa',
    email: 'carlos@example.com',
    teamId: 'team-2',
    courseId: 'course-1',
    password: 'formando',
    avatar: 'C',
    darkMode: false,
    messages: [],
    createdAt: '2026-01-03T14:00:00Z',
  },
  {
    id: 'student-6',
    name: 'Rita Almeida',
    email: 'rita@example.com',
    teamId: 'team-3',
    courseId: 'course-2',
    password: 'formando',
    avatar: 'R',
    darkMode: false,
    messages: [],
    createdAt: '2026-02-01T11:00:00Z',
  }
];

let mockSprints = [
  {
    id: 'sprint-1',
    name: 'Sprint 1 - Fundamentos',
    goal: 'Criar a estrutura base da aplicação',
    courseId: 'course-1',
    teamId: 'team-1',
    startDate: '2026-01-06',
    endDate: '2026-01-20',
    status: 'active',
    userStories: ['story-1', 'story-2', 'story-3', 'story-4'],
    velocity: 0,
    createdAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'sprint-2',
    name: 'Sprint 2 - Funcionalidades Core',
    goal: 'Implementar login e dashboard',
    courseId: 'course-1',
    teamId: 'team-1',
    startDate: '2026-01-21',
    endDate: '2026-02-04',
    status: 'planning',
    userStories: ['story-5', 'story-6'],
    velocity: 0,
    createdAt: '2026-01-05T11:00:00Z',
  },
  {
    id: 'sprint-3',
    name: 'Sprint 1 - Início',
    goal: 'Setup inicial',
    courseId: 'course-1',
    teamId: 'team-2',
    startDate: '2026-01-06',
    endDate: '2026-01-20',
    status: 'active',
    userStories: ['story-7'],
    velocity: 0,
    createdAt: '2026-01-05T12:00:00Z',
  }
];

const mockStories = [
  {
    id: 'story-1',
    title: 'Criar página de login',
    description: 'Como utilizador, quero fazer login no sistema para aceder às funcionalidades',
    acceptanceCriteria: '- Campo de email\n- Campo de password\n- Botão de login\n- Validação de campos',
    priority: 'high',
    points: 5,
    status: 'inProgress',
    assignee: 'João Silva',
    team: 'Equipa Alpha',
    courseId: 'course-1',
    sprintIds: ['sprint-1'],
    votes: [
      { studentName: 'João Silva', value: 5 },
      { studentName: 'Maria Santos', value: 5 },
      { studentName: 'Pedro Costa', value: 5 }
    ],
    createdAt: '2026-01-04T10:00:00Z',
  },
  {
    id: 'story-2',
    title: 'Implementar dashboard principal',
    description: 'Como utilizador, quero ver um dashboard com informações relevantes',
    acceptanceCriteria: '- Widgets informativos\n- Gráficos de progresso\n- Menu lateral',
    priority: 'high',
    points: 8,
    status: 'todo',
    assignee: 'Maria Santos',
    team: 'Equipa Alpha',
    courseId: 'course-1',
    sprintIds: ['sprint-1'],
    votes: [
      { studentName: 'João Silva', value: 8 },
      { studentName: 'Maria Santos', value: 8 },
      { studentName: 'Pedro Costa', value: 8 }
    ],
    createdAt: '2026-01-04T11:00:00Z',
  },
  {
    id: 'story-3',
    title: 'Sistema de notificações',
    description: 'Como utilizador, quero receber notificações sobre eventos importantes',
    acceptanceCriteria: '- Toast notifications\n- Badge de contador\n- Centro de notificações',
    priority: 'medium',
    points: 3,
    status: 'todo',
    assignee: 'Pedro Costa',
    team: 'Equipa Alpha',
    courseId: 'course-1',
    sprintIds: ['sprint-1'],
    votes: [
      { studentName: 'João Silva', value: 3 },
      { studentName: 'Maria Santos', value: 3 },
      { studentName: 'Pedro Costa', value: 3 }
    ],
    createdAt: '2026-01-04T12:00:00Z',
  },
  {
    id: 'story-4',
    title: 'Perfil de utilizador',
    description: 'Como utilizador, quero editar o meu perfil',
    acceptanceCriteria: '- Editar nome\n- Editar email\n- Alterar avatar\n- Salvar alterações',
    priority: 'low',
    points: 0,
    status: 'backlog',
    assignee: '',
    team: 'Equipa Alpha',
    courseId: 'course-1',
    sprintIds: ['sprint-1'],
    votes: [
      { studentName: 'João Silva', value: 2 },
      { studentName: 'Maria Santos', value: 3 },
      { studentName: 'Pedro Costa', value: 2 }
    ],
    createdAt: '2026-01-04T13:00:00Z',
  },
  {
    id: 'story-5',
    title: 'Integração com API externa',
    description: 'Como sistema, quero integrar com API de terceiros',
    acceptanceCriteria: '- Configurar autenticação\n- Implementar endpoints\n- Tratar erros',
    priority: 'high',
    points: 13,
    status: 'backlog',
    assignee: '',
    team: 'Equipa Alpha',
    courseId: 'course-1',
    sprintIds: ['sprint-2'],
    votes: [
      { studentName: 'João Silva', value: 13 },
      { studentName: 'Maria Santos', value: 13 },
      { studentName: 'Pedro Costa', value: 13 }
    ],
    createdAt: '2026-01-04T14:00:00Z',
  },
  {
    id: 'story-6',
    title: 'Testes automatizados',
    description: 'Como desenvolvedor, quero ter testes automatizados',
    acceptanceCriteria: '- Testes unitários\n- Testes de integração\n- Coverage > 80%',
    priority: 'medium',
    points: 0,
    status: 'backlog',
    assignee: '',
    team: 'Equipa Alpha',
    courseId: 'course-1',
    sprintIds: ['sprint-2'],
    votes: [
      { studentName: 'João Silva', value: 5 },
      { studentName: 'Maria Santos', value: 8 },
      { studentName: 'Pedro Costa', value: 5 }
    ],
    createdAt: '2026-01-04T15:00:00Z',
  },
  {
    id: 'story-7',
    title: 'Setup do projeto',
    description: 'Como equipa, queremos ter o ambiente configurado',
    acceptanceCriteria: '- Git configurado\n- Dependencies instaladas\n- CI/CD setup',
    priority: 'high',
    points: 5,
    status: 'done',
    assignee: 'Ana Ferreira',
    team: 'Equipa Beta',
    courseId: 'course-1',
    sprintIds: ['sprint-3'],
    votes: [
      { studentName: 'Ana Ferreira', value: 5 },
      { studentName: 'Carlos Lima', value: 5 }
    ],
    createdAt: '2026-01-04T16:00:00Z',
  }
];

const mockAlerts = [
  {
    id: 'alert-1',
    courseId: 'course-1',
    message: 'Sprint Review amanhã às 14h00',
    type: 'info',
    active: true,
    createdAt: '2026-01-06T09:00:00Z',
  },
  {
    id: 'alert-2',
    courseId: 'course-1',
    message: 'Deadline para entrega das user stories: 18/01',
    type: 'warning',
    active: true,
    createdAt: '2026-01-05T15:00:00Z',
  },
  {
    id: 'alert-3',
    courseId: 'course-1',
    message: 'Parabéns! Sprint anterior concluído com sucesso',
    type: 'success',
    active: true,
    createdAt: '2026-01-04T10:00:00Z',
  }
];

const mockMessages = [
  {
    id: 'msg-1',
    studentId: 'student-1',
    message: 'Bem-vindo ao curso de Scrum! Estamos ansiosos para trabalhar contigo.',
    read: false,
    createdAt: '2026-01-03T10:00:00Z',
  },
  {
    id: 'msg-2',
    studentId: 'student-1',
    message: 'Lembra-te de completar as user stories atribuídas até sexta-feira.',
    read: false,
    createdAt: '2026-01-05T14:00:00Z',
  }
];

/**
 * Mock API - Simula o backend do Supabase
 */
export const mockAPI = {
  // ========== COURSES ==========
  async getCourses() {
    await delay(300);
    return { success: true, courses: mockCourses };
  },

  async getCourse(id: string) {
    await delay(200);
    const course = mockCourses.find(c => c.id === id);
    if (!course) return { success: false, error: 'Curso não encontrado' };
    return { success: true, course };
  },

  async createCourse(data: any) {
    await delay(300);
    const newCourse = {
      id: `course-${Date.now()}`,
      ...data,
      teams: [],
      createdAt: new Date().toISOString(),
    };
    mockCourses.push(newCourse);
    return { success: true, course: newCourse };
  },

  async updateCourse(id: string, data: any) {
    await delay(200);
    const index = mockCourses.findIndex(c => c.id === id);
    if (index === -1) return { success: false, error: 'Curso não encontrado' };
    mockCourses[index] = { ...mockCourses[index], ...data };
    return { success: true, course: mockCourses[index] };
  },

  async deleteCourse(id: string) {
    await delay(200);
    const index = mockCourses.findIndex(c => c.id === id);
    if (index === -1) return { success: false, error: 'Curso não encontrado' };
    mockCourses.splice(index, 1);
    return { success: true, message: 'Curso apagado' };
  },

  // ========== TEAMS ==========
  async getTeams() {
    await delay(200);
    return { success: true, teams: mockTeams };
  },

  async createTeam(data: any) {
    await delay(300);
    const newTeam = {
      id: `team-${Date.now()}`,
      ...data,
      students: [],
      sprints: [],
      createdAt: new Date().toISOString(),
    };
    mockTeams.push(newTeam);
    return { success: true, team: newTeam };
  },

  async updateTeam(id: string, data: any) {
    await delay(200);
    const index = mockTeams.findIndex(t => t.id === id);
    if (index === -1) return { success: false, error: 'Equipa não encontrada' };
    mockTeams[index] = { ...mockTeams[index], ...data };
    return { success: true, team: mockTeams[index] };
  },

  async deleteTeam(id: string) {
    await delay(200);
    const index = mockTeams.findIndex(t => t.id === id);
    if (index === -1) return { success: false, error: 'Equipa não encontrada' };
    mockTeams.splice(index, 1);
    return { success: true, message: 'Equipa apagada' };
  },

  // ========== STUDENTS ==========
  async getStudents() {
    await delay(200);
    return { success: true, students: mockStudents };
  },

  async createStudent(data: any) {
    await delay(300);
    const newStudent = {
      id: `student-${Date.now()}`,
      ...data,
      password: 'formando',
      avatar: data.name?.charAt(0).toUpperCase() || 'U',
      darkMode: false,
      messages: [],
      createdAt: new Date().toISOString(),
    };
    mockStudents.push(newStudent);
    return { success: true, student: newStudent };
  },

  async updateStudent(id: string, data: any) {
    await delay(200);
    const index = mockStudents.findIndex(s => s.id === id);
    if (index === -1) return { success: false, error: 'Formando não encontrado' };
    mockStudents[index] = { ...mockStudents[index], ...data };
    return { success: true, student: mockStudents[index] };
  },

  async deleteStudent(id: string) {
    await delay(200);
    const index = mockStudents.findIndex(s => s.id === id);
    if (index === -1) return { success: false, error: 'Formando não encontrado' };
    mockStudents.splice(index, 1);
    return { success: true, message: 'Formando removido' };
  },

  // ========== SPRINTS ==========
  async getSprints() {
    await delay(200);
    
    // 🔧 LAZY INIT - Só inicializar se array estiver vazio
    if (mockSprints.length === 0) {
      console.log('[MockAPI getSprints] 🔧 LAZY INIT: Inicializando sprints default...');
      
      mockSprints = [
        {
          id: 'sprint-1',
          name: 'Sprint 1 - Fundamentos',
          goal: 'Criar a estrutura base da aplicação',
          courseId: 'course-1',
          teamId: 'team-1',
          startDate: '2026-01-06',
          endDate: '2026-01-20',
          status: 'active',
          userStories: ['story-1', 'story-2', 'story-3', 'story-4'],
          velocity: 0,
          createdAt: '2026-01-05T10:00:00Z',
        },
        {
          id: 'sprint-2',
          name: 'Sprint 2 - Funcionalidades Core',
          goal: 'Implementar login e dashboard',
          courseId: 'course-1',
          teamId: 'team-1',
          startDate: '2026-01-21',
          endDate: '2026-02-04',
          status: 'planning',
          userStories: ['story-5', 'story-6'],
          velocity: 0,
          createdAt: '2026-01-05T11:00:00Z',
        },
        {
          id: 'sprint-3',
          name: 'Sprint 1 - Início',
          goal: 'Setup inicial',
          courseId: 'course-1',
          teamId: 'team-2',
          startDate: '2026-01-06',
          endDate: '2026-01-20',
          status: 'active',
          userStories: ['story-7'],
          velocity: 0,
          createdAt: '2026-01-05T12:00:00Z',
        }
      ];
    }
    
    // ✅ Calcular estatísticas de cada sprint (user stories, story points, conclusão)
    const sprintsWithStats = mockSprints.map(sprint => {
      // Buscar todas as user stories deste sprint
      const sprintStories = mockStories.filter(story => story.sprintIds.includes(sprint.id));
      
      // Calcular métricas
      const userStoryCount = sprintStories.length;
      const totalStoryPoints = sprintStories.reduce((sum, story) => sum + (Number(story.points) || 0), 0);
      const completedStories = sprintStories.filter(story => story.status === 'done').length;
      const completionRate = userStoryCount > 0 
        ? Math.round((completedStories / userStoryCount) * 100) 
        : 0;
      
      return {
        ...sprint,
        userStoryCount,
        totalStoryPoints,
        completionRate
      };
    });
    
    console.log('[MockAPI getSprints] ✅ Retornando:', sprintsWithStats.length, 'sprints com estatísticas');
    console.log('[MockAPI getSprints] 📋 Sprints disponíveis:', sprintsWithStats.map(s => `${s.id} (${s.name}, ${s.userStoryCount} stories, ${s.totalStoryPoints} pts)`));
    
    return { success: true, sprints: sprintsWithStats };
  },

  async createSprint(data: any) {
    await delay(300);
    const newSprint = {
      id: `sprint-${Date.now()}`,
      ...data,
      userStories: [],
      velocity: 0,
      createdAt: new Date().toISOString(),
    };
    mockSprints.push(newSprint);
    return { success: true, sprint: newSprint };
  },

  async updateSprint(id: string, data: any) {
    await delay(200);
    const index = mockSprints.findIndex(s => s.id === id);
    if (index === -1) return { success: false, error: 'Sprint não encontrado' };
    mockSprints[index] = { ...mockSprints[index], ...data };
    return { success: true, sprint: mockSprints[index] };
  },

  async deleteSprint(id: string) {
    await delay(200);
    const index = mockSprints.findIndex(s => s.id === id);
    if (index === -1) return { success: false, error: 'Sprint não encontrado' };
    mockSprints.splice(index, 1);
    return { success: true, message: 'Sprint apagado' };
  },

  // ========== STORIES ==========
  async getStories() {
    await delay(200);
    return { success: true, stories: mockStories };
  },

  async createStory(data: any) {
    await delay(300);
    const newStory = {
      id: `story-${Date.now()}`,
      ...data,
      points: data.points || 0,
      status: data.status || 'backlog',
      sprintIds: data.sprintIds || [],
      votes: data.votes || [], // ✅ GARANTIR QUE VOTES EXISTE
      createdAt: new Date().toISOString(),
    };
    mockStories.push(newStory);
    return { success: true, story: newStory };
  },

  async updateStory(id: string, data: any) {
    await delay(200);
    const index = mockStories.findIndex(s => s.id === id);
    if (index === -1) return { success: false, error: 'User Story não encontrada' };
    mockStories[index] = { ...mockStories[index], ...data };
    return { success: true, story: mockStories[index] };
  },

  async deleteStory(id: string) {
    await delay(200);
    const index = mockStories.findIndex(s => s.id === id);
    if (index === -1) return { success: false, error: 'User Story não encontrada' };
    mockStories.splice(index, 1);
    return { success: true, message: 'User Story apagada' };
  },

  // ========== ALERTS ==========
  async getAlerts() {
    await delay(150);
    return { success: true, alerts: mockAlerts };
  },

  async createAlert(data: any) {
    await delay(200);
    const newAlert = {
      id: `alert-${Date.now()}`,
      ...data,
      active: true,
      createdAt: new Date().toISOString(),
    };
    mockAlerts.push(newAlert);
    return { success: true, alert: newAlert };
  },

  async updateAlert(id: string, data: any) {
    await delay(150);
    const index = mockAlerts.findIndex(a => a.id === id);
    if (index === -1) return { success: false, error: 'Alerta não encontrado' };
    mockAlerts[index] = { ...mockAlerts[index], ...data };
    return { success: true, alert: mockAlerts[index] };
  },

  async deleteAlert(id: string) {
    await delay(150);
    const index = mockAlerts.findIndex(a => a.id === id);
    if (index === -1) return { success: false, error: 'Alerta não encontrado' };
    mockAlerts.splice(index, 1);
    return { success: true, message: 'Alerta apagado' };
  },

  // ========== MESSAGES ==========
  async getMessages(studentId: string) {
    await delay(150);
    const messages = mockMessages.filter(m => m.studentId === studentId);
    return { success: true, messages };
  },

  async createMessage(data: any) {
    await delay(200);
    const newMessage = {
      id: `msg-${Date.now()}`,
      ...data,
      read: false,
      createdAt: new Date().toISOString(),
    };
    mockMessages.push(newMessage);
    return { success: true, message: newMessage };
  },

  async updateMessage(id: string, data: any) {
    await delay(150);
    const index = mockMessages.findIndex(m => m.id === id);
    if (index === -1) return { success: false, error: 'Mensagem não encontrada' };
    mockMessages[index] = { ...mockMessages[index], ...data };
    return { success: true, message: mockMessages[index] };
  },
};

/**
 * Simula delay de rede
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verificar se está em modo mock
 */
export function isMockMode(): boolean {
  return localStorage.getItem('useMockAPI') === 'true';
}

/**
 * Ativar/desativar modo mock
 */
export function setMockMode(enabled: boolean): void {
  localStorage.setItem('useMockAPI', enabled ? 'true' : 'false');
  console.log(`[MockAPI] Modo mock ${enabled ? 'ATIVADO' : 'DESATIVADO'}`);
}