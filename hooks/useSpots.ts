import { useAuth } from '@/context/AuthContext';
import { isNetworkError, spotsApi } from '@/services';
import { PendingSpot, spotsStore } from '@/services/offline';
import { Spot } from '@/types';
import { useEffect, useState } from 'react';

export const useSpots = () => {
    const { user, token } = useAuth();
    const userId = user?.id;

    const [spots, setSpots] = useState<Spot[]>([]);
    const [pending, setPending] = useState<PendingSpot[]>([]);
    const [loading, setLoading] = useState(false);
    const [showingOfflineCopy, setShowingOfflineCopy] = useState(false);

    // Show the on-device copy first, then refresh from the server if we can
    useEffect(() => {
        if (!token || userId === undefined) return;

        const loadLocal = async () => {
            const [cached, queued] = await Promise.all([
                spotsStore.getCached(userId),
                spotsStore.getPending(userId),
            ]);
            setSpots(cached);
            setPending(queued);
        };

        const loadSpots = async () => {
            await loadLocal();
            setLoading(true);
            try {
                const data = await spotsApi.getSpots();
                setSpots(data);
                setShowingOfflineCopy(false);
                await spotsStore.setCached(userId, data);
            } catch (err) {
                setShowingOfflineCopy(true);
                if (!isNetworkError(err)) console.error('Failed to fetch spots:', err);
            } finally {
                setLoading(false);
            }
        };

        loadSpots();
        // Pending spots uploaded in the background
        const unsubscribe = spotsStore.subscribe(loadLocal);

        // Runs on logout, user switch, or unmount: stop listening and drop the old user's spots
        return () => {
            unsubscribe();
            setSpots([]);
            setPending([]);
            setShowingOfflineCopy(false);
        };
    }, [token, userId]);

    return { spots, pending, loading, showingOfflineCopy}
};

