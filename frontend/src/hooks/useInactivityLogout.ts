import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

export function useInactivityLogout() {
  const navigate  = useNavigate();
  const timerRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const reset = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
      }, TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, reset));
    reset();

    return () => {
      clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [navigate]);
}
