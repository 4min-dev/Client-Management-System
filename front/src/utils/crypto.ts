import CryptoJS from 'crypto-js';
import { decode } from '@msgpack/msgpack';

export const updateCryptoKey = async (stationId: string, macAddress: string) => {
    const CRYPTO_KEY = '3901c991783353e98e1e39d54ad5a1fc';

    const payload = JSON.stringify({ stationId, macAddress });
    const encrypted = await encryptData(payload, CRYPTO_KEY);

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/crypto/key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: encrypted }),
    });

    const json = await res.json();
    const decrypted = await decryptData(json.data, CRYPTO_KEY);

    return JSON.parse(decrypted); // → { key: "...", expiredAt: "..." }
};

export const decryptData = (encrypted: string, key: string): any => {
    const [ivHex, encryptedHex] = encrypted.split(':');
    if (!ivHex || !encryptedHex) throw new Error('Invalid format');

    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const ciphertext = CryptoJS.enc.Hex.parse(encryptedHex);

    const derivedKey = CryptoJS.PBKDF2(key, 'salt', {
        keySize: 8,
        iterations: 10000,
        hasher: CryptoJS.algo.SHA256,
    });

    const decrypted = CryptoJS.AES.decrypt(
        { ciphertext } as any,
        derivedKey,
        {
            iv,
            mode: CryptoJS.mode.CTR,
            padding: CryptoJS.pad.NoPadding,
        }
    );

    const decryptedString = decrypted.toString(CryptoJS.enc.Latin1);

    if (!decryptedString) {
        throw new Error('Decryption failed');
    }

    const byteLength = decrypted.sigBytes;
    const actualString = decryptedString.slice(0, byteLength);

    try {
        return JSON.parse(actualString);
    } catch (e: any) {
        console.error('Decrypted (raw):', actualString);
        throw new Error('Failed to parse JSON: ' + e.message);
    }
};

export const encryptData = (message: string, key: string): string => {
    const iv = CryptoJS.lib.WordArray.random(16);
    const derivedKey = CryptoJS.PBKDF2(key, 'salt', {
        keySize: 8,
        iterations: 10000,
        hasher: CryptoJS.algo.SHA256,
    });

    const encrypted = CryptoJS.AES.encrypt(message, derivedKey, {
        iv,
        mode: CryptoJS.mode.CTR,
        padding: CryptoJS.pad.NoPadding,
    });

    return iv.toString(CryptoJS.enc.Hex) + ':' + encrypted.ciphertext.toString(CryptoJS.enc.Hex);
};