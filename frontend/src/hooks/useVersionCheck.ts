import { useEffect } from 'react';

export function useVersionCheck() {
  useEffect(() => {
    const stored = localStorage.getItem('sofitul_version');
    fetch('/version.json?t=' + Date.now())
      .then(r => r.json())
      .then(data => {
        const v = String(data.v);
        if (!stored) { localStorage.setItem('sofitul_version', v); return; }
        if (stored !== v) { localStorage.setItem('sofitul_version', v); window.location.reload(); }
      })
      .catch(() => {/* silenciar */});
  }, []);
}
