/**
 * Toast — notificación flotante auto-dismiss (3 s).
 * Uso:
 *   const [toast, setToast] = useState('');
 *   // después de acción:  setToast('Mensaje');
 *   // en JSX:  {toast && <Toast message={toast} onClose={() => setToast('')} />}
 */
import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex items-center gap-2.5
                    bg-gray-900 text-white text-sm font-medium
                    px-4 py-3 rounded-xl shadow-2xl
                    pointer-events-none select-none">
      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
      {message}
    </div>
  );
}
