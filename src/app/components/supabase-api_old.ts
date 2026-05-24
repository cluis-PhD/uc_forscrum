import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2c310e02`;

/**
 * GET - Buscar todos os dados
 * @returns Array de itens salvos
 */
export async function getData() {
  try {
    const response = await fetch(`${API_BASE_URL}/data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Erro ao buscar dados');
    }
    
    return {
      success: true,
      data: result.data || []
    };
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return {
      success: false,
      error: String(error),
      data: []
    };
  }
}

/**
 * POST - Criar novo dado
 * @param nome - Valor a ser salvo
 * @returns Resultado da operação com ID do item criado
 */
export async function createData(nome: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ nome })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Erro ao criar dado');
    }
    
    return {
      success: true,
      message: result.message,
      id: result.id
    };
  } catch (error) {
    console.error('Erro ao criar dado:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}
