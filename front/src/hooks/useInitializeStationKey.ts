import { useEffect, useState } from 'react';
import { getServerMacAddress } from '../utils/network';
import { decryptWithBackendKey } from '../utils/crypto';
import { stationService, useInitializeStationKeyMutation } from '../services/stationService';

export function useInitializeStationKey(stationId: string) {
    const [initialize] = useInitializeStationKeyMutation();
    const [isReady, setIsReady] = useState(false);
    const [stationKey, setStationKey] = useState<string | null>(null);

    const keyStorage = `STATION_CRYPTO_KEY_${stationId}`;
    const expiresStorage = `STATION_KEY_EXPIRES_${stationId}`;

    const initKey = async () => {
        try {
            const mac = await getServerMacAddress();
            const res = await initialize({ stationId, macAddress: mac }).unwrap();

            const encryptedKeyData = res.data.data;
            console.log('Encrypted key data:', encryptedKeyData);

            const decryptedJson = await decryptWithBackendKey(encryptedKeyData);
            console.log('Decrypted JSON:', decryptedJson);

            const { key } = JSON.parse(decryptedJson);

            if (key.length !== 32) {
                throw new Error(`Invalid station key length: ${key.length}`);
            }

            localStorage.setItem(keyStorage, key);
            localStorage.setItem(expiresStorage, new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString());
            setStationKey(key);
            setIsReady(true);
            console.log('Station key initialized:', key);
        } catch (err: any) {
            console.error('Key init failed:', err);
            setIsReady(false);
        }
    };

    const loadKey = () => {
        const savedKey = localStorage.getItem(keyStorage);
        const expires = localStorage.getItem(expiresStorage);

        if (savedKey && expires && new Date(expires) > new Date()) {
            setStationKey(savedKey);
            setIsReady(true);
            console.log('Key loaded from storage:', savedKey);
            return true;
        } else {
            localStorage.removeItem(keyStorage);
            localStorage.removeItem(expiresStorage);
            return false;
        }
    };

    useEffect(() => {
        if (!loadKey()) {
            console.log('No valid key, initializing...');
            initKey();
        }
    }, [stationId]);

    const refetch = async () => {
        localStorage.removeItem(keyStorage);
        localStorage.removeItem(expiresStorage);
        setIsReady(false);
        setStationKey(null);
        await initKey();
    };

    const updateKey = (newKey: string, expiredAt: string) => {
        localStorage.setItem(keyStorage, newKey);
        localStorage.setItem(expiresStorage, expiredAt);
        setStationKey(newKey);
        setIsReady(true);
        console.log('Station key updated after MAC reset:', newKey);
    };

    return { isReady, stationKey, refetch, updateKey };
}