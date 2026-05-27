import { useToastContext } from '../context/ToastContext';

export function useToast() {
  const { addToast } = useToastContext();

  return {
    success(title: string, message?: string) {
      addToast({ type: 'success', title, message });
    },
    error(title: string, message?: string) {
      addToast({ type: 'error', title, message });
    },
    warning(title: string, message?: string) {
      addToast({ type: 'warning', title, message });
    },
    info(title: string, message?: string) {
      addToast({ type: 'info', title, message });
    },
  };
}
