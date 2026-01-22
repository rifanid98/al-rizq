import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface StarAnimation {
    id: string;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    count: number;
}

interface StarAnimationContextType {
    triggerAnimation: (rect: DOMRect, count?: number) => void;
    registerTarget: (ref: React.RefObject<HTMLElement>) => void;
    animations: StarAnimation[];
    removeAnimation: (id: string) => void;
}

const StarAnimationContext = createContext<StarAnimationContextType | undefined>(undefined);

export const StarAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [animations, setAnimations] = useState<StarAnimation[]>([]);
    const targetRef = useRef<HTMLElement | null>(null);

    const registerTarget = useCallback((ref: React.RefObject<HTMLElement>) => {
        // We might have multiple registers (desktop/mobile), last one wins or logic to pick visible one.
        // For simplicity, we can just update current ref.
        // Better logic: App passes the ref of the CURRENTLY VISIBLE settings icon.
        if (ref.current) {
            targetRef.current = ref.current;
        }
    }, []);

    const triggerAnimation = useCallback((startRect: DOMRect, count: number = 5) => {
        if (!targetRef.current) return;

        const targetRect = targetRef.current.getBoundingClientRect();

        // Center of start
        const startX = startRect.left + startRect.width / 2;
        const startY = startRect.top + startRect.height / 2;

        // Center of target
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        const id = Date.now().toString() + Math.random();

        setAnimations(prev => [...prev, {
            id,
            startX,
            startY,
            targetX,
            targetY,
            count
        }]);
    }, []);

    const removeAnimation = useCallback((id: string) => {
        setAnimations(prev => prev.filter(a => a.id !== id));
    }, []);

    return (
        <StarAnimationContext.Provider value={{ triggerAnimation, registerTarget, animations, removeAnimation }}>
            {children}
        </StarAnimationContext.Provider>
    );
};

export const useStarAnimation = () => {
    const context = useContext(StarAnimationContext);
    if (!context) {
        throw new Error('useStarAnimation must be used within a StarAnimationProvider');
    }
    return context;
};
