/**
 * Sistema de Retry Automático para chamadas API
 * Trata erros de timeout e problemas de rede
 */

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Executa uma função com retry automático
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry = () => {}
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Não retry em erros 4xx (client errors)
      if (error.message?.includes('400') || 
          error.message?.includes('401') || 
          error.message?.includes('403') || 
          error.message?.includes('404')) {
        throw error;
      }
      
      // Último attempt, não fazer retry
      if (attempt === maxRetries) {
        break;
      }
      
      // Calcular delay com backoff exponencial
      const delay = delayMs * Math.pow(backoffMultiplier, attempt);
      
      console.log(`[RETRY] Tentativa ${attempt + 1}/${maxRetries} falhou. Retry em ${delay}ms...`);
      onRetry(attempt + 1, error);
      
      // Aguardar antes de retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Verifica se o erro é de timeout/conexão
 */
export function isNetworkError(error: any): boolean {
  const errorString = error?.message?.toLowerCase() || '';
  
  return (
    errorString.includes('timeout') ||
    errorString.includes('timed out') ||
    errorString.includes('connection') ||
    errorString.includes('522') ||
    errorString.includes('503') ||
    errorString.includes('502') ||
    errorString.includes('network') ||
    errorString.includes('fetch')
  );
}

/**
 * Formata mensagem de erro user-friendly
 */
export function formatErrorMessage(error: any): string {
  if (isNetworkError(error)) {
    return 'Problema de conexão com o servidor. A tentar novamente...';
  }
  
  if (error.message?.includes('404')) {
    return 'Recurso não encontrado';
  }
  
  if (error.message?.includes('401') || error.message?.includes('403')) {
    return 'Sem permissão para aceder a este recurso';
  }
  
  return error.message || 'Erro desconhecido';
}

/**
 * Wrapper para fetch com retry automático
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return withRetry(
    async () => {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000) // 30s timeout
      });
      
      // Se não OK e é erro de servidor (5xx), lançar erro para retry
      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      return response;
    },
    retryOptions
  );
}
