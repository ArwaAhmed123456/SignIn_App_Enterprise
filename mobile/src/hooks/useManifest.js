import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

/**
 * useManifest — Phase 2: Offline-First Evacuation Manifest
 *
 * Polling hook that fetches the live manifest from the server every 30s.
 * Uses ETags to avoid unnecessary bandwidth.
 * Saves the latest manifest to AsyncStorage for offline safety.
 * If the network fails, falls back instantly to the AsyncStorage copy.
 */
export const useManifest = (projectCode) => {
    const [workers, setWorkers] = useState([]);
    const [count, setCount] = useState(0);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isOffline, setIsOffline] = useState(false);
    const [isStale, setIsStale] = useState(false);
    const [loading, setLoading] = useState(true);

    const STORAGE_KEY = `@manifest_${projectCode}`;

    const fetchManifest = useCallback(async () => {
        if (!projectCode) return;

        try {
            // Check ETag from last fetch if available
            const cachedEtag = await AsyncStorage.getItem(`${STORAGE_KEY}_etag`);
            const headers = cachedEtag ? { 'If-None-Match': cachedEtag } : {};

            const response = await api.get(`/manifest/${projectCode}`, {
                headers,
                timeout: 5000 // fail fast so we can fallback to offline
            });

            if (response.status === 200) {
                const data = response.data;
                setWorkers(data.workers);
                setCount(data.count);
                const updatedTime = new Date(data.generated_at);
                setLastUpdated(updatedTime);
                setIsOffline(false);
                setIsStale(false);

                // Save to offline storage
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                if (response.headers.etag) {
                    await AsyncStorage.setItem(`${STORAGE_KEY}_etag`, response.headers.etag);
                }
            } else if (response.status === 304) {
                // Not modified, our memory state is fine, just clear offline flag
                setIsOffline(false);
            }
        } catch (err) {
            console.log('[Manifest Sync Failed]', err.message);
            // Network failure or timeout -> fallback to offline storage
            await loadOfflineManifest();
        } finally {
            setLoading(false);
        }
    }, [projectCode]);

    const loadOfflineManifest = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                setWorkers(data.workers);
                setCount(data.count);
                const updatedTime = new Date(data.generated_at);
                setLastUpdated(updatedTime);
                setIsOffline(true);

                // If the data is older than 5 minutes, mark as stale
                const ageMinutes = (new Date() - updatedTime) / (1000 * 60);
                setIsStale(ageMinutes > 5);
            }
        } catch (e) {
            console.error('Failed to load offline manifest', e);
        }
    };

    // Initial load + poll every 30s
    useEffect(() => {
        fetchManifest();
        const interval = setInterval(fetchManifest, 30000);
        return () => clearInterval(interval);
    }, [fetchManifest]);

    return { workers, count, lastUpdated, isOffline, isStale, loading, refetch: fetchManifest };
};
