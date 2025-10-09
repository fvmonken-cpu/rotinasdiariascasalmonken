import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
    }>;
}
const InstallButton: React.FC = ()=>{
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    useEffect(()=>{
        const handleBeforeInstallPrompt = (e: Event)=>{
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
            console.log('💡 PWA install prompt available');
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return ()=>{
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);
    const handleInstallClick = async ()=>{
        if (!deferredPrompt) {
            console.log('❌ No install prompt available');
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
        } else {
            console.log('❌ User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
    };
    if (!isInstallable) {
        return null;
    }
    return (<Button onClick={handleInstallClick} variant="outline" size="sm" className="fixed bottom-4 right-4 z-50 shadow-lg bg-blue-600 text-white border-blue-600 hover:bg-blue-700" data-spec-id="install-pwa-button">
      <Download className="w-4 h-4 mr-2" data-spec-id="download-icon"/>
      Instalar App
    </Button>);
};
export default InstallButton;
