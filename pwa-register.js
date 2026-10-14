// Optional browser integration; failure never blocks the game or touches saves.
(() => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  if (!['http:', 'https:'].includes(location.protocol)) return;
  const base = new URL('./', document.currentScript.src);
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register(new URL('service-worker.js', base).href, {
        scope: base.href,
        updateViaCache: 'none'
      });
    } catch (error) { console.warn('[ZoneRPG PWA] Регистрация недоступна:', error); }
  }, { once: true });
})();
