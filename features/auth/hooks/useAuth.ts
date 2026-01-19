
import { useState, useCallback, useEffect } from 'react';
import { UserProfile } from '../../../shared/types';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || "";

export const useAuth = () => {
    const [user, setUser] = useState<UserProfile | null>(() => {
        const savedUser = localStorage.getItem('al_rizq_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [isGoogleReady, setIsGoogleReady] = useState(!!(window as any).google?.accounts?.id);

    const logout = useCallback(() => {
        setUser(null);
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('al_rizq_') && key !== 'al_rizq_theme') {
                localStorage.removeItem(key);
            }
        });

        if ((window as any).google?.accounts?.id) {
            (window as any).google.accounts.id.disableAutoSelect();
        }
    }, []);

    const initGoogle = useCallback((callback: (response: any) => void) => {
        if ((window as any).google?.accounts?.id) {
            (window as any).google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                auto_select: false,
                context: 'signin',
                callback: callback
            });
        }
    }, []);

    useEffect(() => {
        if (!(window as any).google?.accounts?.id) {
            const script = document.createElement('script');
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = () => {
                setIsGoogleReady(true);
            };
            document.head.appendChild(script);
        } else {
            setIsGoogleReady(true);
        }
    }, []);

    return { user, setUser, logout, initGoogle, isGoogleReady };
};
