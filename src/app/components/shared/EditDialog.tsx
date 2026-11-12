import { useEffect, useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

export interface EditField {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'date';
  required?: boolean;
}

interface EditDialogProps {
  open: boolean;
  title: string;
  fields: EditField[];
  initial: Record<string, any>;
  onClose: () => void;
  onSave: (values: Record<string, string>) => Promise<void>;
}

/** Converte "dd/mm/aaaa" em "aaaa-mm-dd" para o campo de data. */
function toDateInput(v: any): string {
  if (!v) return '';
  const s = String(v);
  const pt = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (pt) return `${pt[3]}-${pt[2].padStart(2, '0')}-${pt[1].padStart(2, '0')}`;
  return s.slice(0, 10);
}

export function EditDialog({ open, title, fields, initial, onClose, onSave }: EditDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const v: Record<string, string> = {};
    fields.forEach((f) => {
      v[f.key] = f.type === 'date' ? toDateInput(initial?.[f.key]) : (initial?.[f.key] ?? '');
    });
    setValues(v);
    setError('');
  }, [open, initial]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = fields.find((f) => f.required && !values[f.key]?.trim());
    if (missing) {
      setError(`Preencha o campo "${missing.label}"`);
      return;
    }
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível guardar');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2.5 border-2 border-slate-200 rounded-[10px] text-[0.9375rem] focus:outline-none focus:border-[#3b8433] dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100';

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-dialog-title"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-[16px] w-full max-w-md p-5 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="edit-dialog-title" className="text-[1.125rem] font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="block text-[0.8125rem] text-slate-600 mb-1 dark:text-slate-300">
                {f.label}{f.required && ' *'}
              </span>
              {f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  className={inputCls}
                  value={values[f.key] ?? ''}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              ) : (
                <input
                  type={f.type === 'date' ? 'date' : 'text'}
                  className={inputCls}
                  value={values[f.key] ?? ''}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              )}
            </label>
          ))}
        </div>

        {error && <p className="mt-3 text-[0.8125rem] text-red-600" role="alert">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-slate-200 rounded-[10px] text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-[#3b8433] hover:bg-[#2f6b29] text-white rounded-[10px] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
