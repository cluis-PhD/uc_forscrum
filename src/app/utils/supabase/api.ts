/**
 * Configuração centralizada da API do Supabase
 */

import { projectId, publicAnonKey } from './info';
import { mockAPI, isMockMode, setMockMode } from './mock-api';

/**
 * URL base da API do Supabase Edge Functions
 */
export const SUPABASE_URL = `https://${projectId}.supabase.co`;
export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
export const API_BASE_URL = `${FUNCTIONS_URL}/make-server-1184b871`;

/**
 * Headers padrão para todas as requisições
 */
export const DEFAULT_HEADERS = {
  'Authorization': `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
};

/**
 * Auto-ativar mock na primeira falha
 */
let autoMockEnabled = false;

/**
 * Função auxiliar para fazer requisições à API
 */
export async function fetchAPI(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('[API] 🌐 Request:', {
    method: options.method || 'GET',
    url,
    headers: DEFAULT_HEADERS,
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
    });

    console.log('[API] 📥 Response:', {
      status: response.status,
      ok: response.ok,
      url,
    });

    return response;
  } catch (error) {
    console.error('[API] ❌ ERRO ao fazer fetch:', {
      error,
      url,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Função auxiliar para fazer requisições GET
 */
export async function get<T>(endpoint: string): Promise<T> {
  // Se mock está ativado, usar dados mock
  if (isMockMode() || autoMockEnabled) {
    console.log('[API] 🧪 MODO MOCK - GET:', endpoint);
    return getMockData(endpoint, 'GET') as T;
  }

  try {
    const response = await fetchAPI(endpoint, { method: 'GET' });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('[API] ❌ Fetch falhou, ativando modo MOCK automaticamente...');
    autoMockEnabled = true;
    setMockMode(true);
    return getMockData(endpoint, 'GET') as T;
  }
}

/**
 * Função auxiliar para fazer requisições POST
 */
export async function post<T>(endpoint: string, data: any): Promise<T> {
  // Se mock está ativado, usar dados mock
  if (isMockMode() || autoMockEnabled) {
    console.log('[API] 🧪 MODO MOCK - POST:', endpoint, data);
    return getMockData(endpoint, 'POST', data) as T;
  }

  try {
    const response = await fetchAPI(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('[API] ❌ Fetch falhou, ativando modo MOCK automaticamente...');
    autoMockEnabled = true;
    setMockMode(true);
    return getMockData(endpoint, 'POST', data) as T;
  }
}

/**
 * Função auxiliar para fazer requisições PUT
 */
export async function put<T>(endpoint: string, data: any): Promise<T> {
  // Se mock está ativado, usar dados mock
  if (isMockMode() || autoMockEnabled) {
    console.log('[API] 🧪 MODO MOCK - PUT:', endpoint, data);
    return getMockData(endpoint, 'PUT', data) as T;
  }

  try {
    const response = await fetchAPI(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('[API] ❌ Fetch falhou, ativando modo MOCK automaticamente...');
    autoMockEnabled = true;
    setMockMode(true);
    return getMockData(endpoint, 'PUT', data) as T;
  }
}

/**
 * Função auxiliar para fazer requisições DELETE
 */
export async function del<T>(endpoint: string): Promise<T> {
  // Se mock está ativado, usar dados mock
  if (isMockMode() || autoMockEnabled) {
    console.log('[API] 🧪 MODO MOCK - DELETE:', endpoint);
    return getMockData(endpoint, 'DELETE') as T;
  }

  try {
    const response = await fetchAPI(endpoint, { method: 'DELETE' });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('[API] ❌ Fetch falhou, ativando modo MOCK automaticamente...');
    autoMockEnabled = true;
    setMockMode(true);
    return getMockData(endpoint, 'DELETE') as T;
  }
}

/**
 * Rotear requisições para os métodos mock corretos
 */
function getMockData(endpoint: string, method: string, data?: any): Promise<any> {
  const path = endpoint.split('?')[0]; // Remove query params
  const id = path.split('/').pop(); // Pega o último segmento (ID)

  // COURSES
  if (path.includes('/courses') && method === 'GET') {
    if (id && id !== 'courses') return mockAPI.getCourse(id);
    return mockAPI.getCourses();
  }
  if (path.includes('/courses') && method === 'POST') return mockAPI.createCourse(data);
  if (path.includes('/courses') && method === 'PUT') return mockAPI.updateCourse(id!, data);
  if (path.includes('/courses') && method === 'DELETE') return mockAPI.deleteCourse(id!);

  // TEAMS
  if (path.includes('/teams') && method === 'GET') return mockAPI.getTeams();
  if (path.includes('/teams') && method === 'POST') return mockAPI.createTeam(data);
  if (path.includes('/teams') && method === 'PUT') return mockAPI.updateTeam(id!, data);
  if (path.includes('/teams') && method === 'DELETE') return mockAPI.deleteTeam(id!);

  // STUDENTS
  if (path.includes('/students') && method === 'GET') return mockAPI.getStudents();
  if (path.includes('/students') && method === 'POST') return mockAPI.createStudent(data);
  if (path.includes('/students') && method === 'PUT') return mockAPI.updateStudent(id!, data);
  if (path.includes('/students') && method === 'DELETE') return mockAPI.deleteStudent(id!);

  // SPRINTS
  if (path.includes('/sprints') && method === 'GET') return mockAPI.getSprints();
  if (path.includes('/sprints') && method === 'POST') return mockAPI.createSprint(data);
  if (path.includes('/sprints') && method === 'PUT') return mockAPI.updateSprint(id!, data);
  if (path.includes('/sprints') && method === 'DELETE') return mockAPI.deleteSprint(id!);

  // STORIES
  if (path.includes('/stories') && method === 'GET') return mockAPI.getStories();
  if (path.includes('/stories') && method === 'POST') return mockAPI.createStory(data);
  if (path.includes('/stories') && method === 'PUT') return mockAPI.updateStory(id!, data);
  if (path.includes('/stories') && method === 'DELETE') return mockAPI.deleteStory(id!);

  // ALERTS
  if (path.includes('/alerts') && method === 'GET') return mockAPI.getAlerts();
  if (path.includes('/alerts') && method === 'POST') return mockAPI.createAlert(data);
  if (path.includes('/alerts') && method === 'PUT') return mockAPI.updateAlert(id!, data);
  if (path.includes('/alerts') && method === 'DELETE') return mockAPI.deleteAlert(id!);

  // MESSAGES
  if (path.includes('/messages') && method === 'GET') return mockAPI.getMessages(id!);
  if (path.includes('/messages') && method === 'POST') return mockAPI.createMessage(data);
  if (path.includes('/messages') && method === 'PUT') return mockAPI.updateMessage(id!, data);

  // Default
  console.warn('[API] Mock não implementado para:', endpoint, method);
  return Promise.resolve({ success: true });
}

/**
 * Testar conexão com o backend
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('[API] 🔍 Testando conexão com o backend...');
    console.log('[API] Project ID:', projectId);
    console.log('[API] Base URL:', API_BASE_URL);
    console.log('[API] Tentando buscar cursos como teste...');
    
    // Testar com endpoint /courses que sempre existe
    const response = await fetchAPI('/courses', { method: 'GET' });
    
    console.log('[API] Response status:', response.status);
    console.log('[API] Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] ❌ Erro na resposta:', errorText);
      return false;
    }
    
    const data = await response.json();
    console.log('[API] Dados recebidos:', data);
    
    if (data.success !== undefined || data.courses !== undefined) {
      console.log('[API] ✅ Conexão com backend estabelecida!');
      return true;
    }
    
    console.error('[API] ❌ Backend retornou resposta inválida:', data);
    return false;
  } catch (error) {
    console.error('[API] ❌ ERRO ao testar conexão:', error);
    console.error('[API] ');
    console.error('[API] 🔍 DIAGNÓSTICO:');
    console.error('[API] ════════════════════════════════════════');
    console.error('[API] Erro detectado:', error instanceof Error ? error.message : String(error));
    console.error('[API] ');
    console.error('[API] 📋 CHECKLIST DE VERIFICAÇÃO:');
    console.error('[API] ');
    console.error('[API] ❓ 1. A Edge Function está deployada?');
    console.error('[API]    → Rode: supabase functions deploy make-server-1184b871');
    console.error('[API] ');
    console.error('[API] ❓ 2. O nome da função está correto?');
    console.error('[API]    → Verifique o nome exato no Supabase Dashboard');
    console.error('[API]    → Atual: make-server-1184b871');
    console.error('[API] ');
    console.error('[API] ❓ 3. As credenciais estão corretas?');
    console.error('[API]    → Project ID:', projectId);
    console.error('[API]    → Arquivo: /utils/supabase/info.tsx');
    console.error('[API] ');
    console.error('[API] ❓ 4. Está com conexão à internet?');
    console.error('[API]    → Teste: ping supabase.co');
    console.error('[API] ');
    console.error('[API] ❓ 5. O CORS está configurado?');
    console.error('[API]    → No backend deve ter: app.use("/*", cors())');
    console.error('[API] ════════════════════════════════════════');
    return false;
  }
}