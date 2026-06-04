import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState<any>((window as any).deferredPrompt || null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    setIsIOS(ios);

    // Detect standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setInstallPrompt(e);
    };

    const handleCapturedEvent = () => {
      setInstallPrompt((window as any).deferredPrompt);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      (window as any).deferredPrompt = null;
      setIsStandalone(true);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('beforeinstallprompt_captured', handleCapturedEvent);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('beforeinstallprompt_captured', handleCapturedEvent);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    const promptEvent = installPrompt || (window as any).deferredPrompt;
    if (!promptEvent) return false;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      (window as any).deferredPrompt = null;
      return true;
    }
    return false;
  };

  // We can install if we have the prompt, OR if it's iOS and not standalone (iOS Safari manual instructions)
  const canInstall = !isStandalone && (!!installPrompt || isIOS);

  return { canInstall, install, isStandalone, isIOS };
};
