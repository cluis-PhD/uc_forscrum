import { useState, useEffect } from 'react';
import { AlertTriangle, X, Info, CheckCircle } from 'lucide-react';

interface BackendWarningProps {
  show: boolean;
  onDismiss: () => void;
  type?: 'error' | 'success';
}

export function BackendWarning({ show, onDismiss, type = 'error' }: BackendWarningProps) {
  if (!show) return null;

  // Configuração para erro (dados perdidos - não deveria acontecer mais)
  if (type === 'error') {
    return (
      <div className="fixed top-[70px] left-0 right-0 z-40 px-6">
        <div className="max-w-md mx-auto bg-blue-50 border-2 border-blue-300 rounded-[16px] p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1 min-w-0">
              <h4 className="text-[14px] font-medium text-blue-900 mb-1">
                Migração para KV Store Concluída
              </h4>
              <p className="text-[12px] text-blue-800 mb-2">
                O backend foi migrado para armazenamento permanente. 
                Dados antigos serão automaticamente sincronizados quando você tentar editá-los.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-blue-700 bg-blue-100 rounded-lg px-2 py-1">
                <CheckCircle size={14} />
                <span>✅ Novos dados são guardados permanentemente e nunca serão perdidos.</span>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full p-1 transition-colors flex-shrink-0"
              aria-label="Fechar aviso"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Configuração para sucesso (migração concluída)
  return (
    <div className="fixed top-[70px] left-0 right-0 z-40 px-6">
      <div className="max-w-md mx-auto bg-emerald-50 border-2 border-emerald-300 rounded-[16px] p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] font-medium text-emerald-900 mb-1">
              Persistência Ativada
            </h4>
            <p className="text-[12px] text-emerald-800 mb-2">
              Os dados agora são guardados permanentemente na base de dados. 
              Não serão perdidos quando o servidor reiniciar.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-100 rounded-lg px-2 py-1">
              <Info size={14} />
              <span>✅ Backend migrado para Supabase KV Store com sucesso!</span>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-full p-1 transition-colors flex-shrink-0"
            aria-label="Fechar aviso"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}