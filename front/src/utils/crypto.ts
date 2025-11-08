export async function decryptData(encryptedData: string, key: string): Promise<string> {
    const [ivHex, encryptedHex] = encryptedData.split(':');
    if (!ivHex || !encryptedHex) {
        throw new Error('Invalid encrypted format: missing iv or data');
    }

    const iv = hexToBuffer(ivHex);
    const encrypted = hexToBuffer(encryptedHex);

    const passwordBuffer = new TextEncoder().encode(key);
    const salt = new TextEncoder().encode('salt');

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 10000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-CTR', length: 256 },
        false,
        ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: 'AES-CTR',
            counter: iv,
            length: 128,
        },
        derivedKey,
        encrypted
    );

    return new TextDecoder().decode(decryptedBuffer);
}

export async function encryptWithStationKeyWeb(data: string, stationKeyHex: string): Promise<string> {
    if (stationKeyHex.length !== 32) {
        throw new Error(`Station key must be 32 hex chars (16 bytes), got ${stationKeyHex.length}`);
    }

    const passwordBuffer = new TextEncoder().encode(stationKeyHex);
    const salt = new TextEncoder().encode('salt');

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 10000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-CTR', length: 256 },
        false,
        ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-CTR', counter: iv, length: 128 },
        derivedKey,
        new TextEncoder().encode(data)
    );

    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const encHex = Array.from(new Uint8Array(encryptedBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    return `${ivHex}:${encHex}`;
}

export async function decryptBackendResponse(encryptedHex: string): Promise<string> {
    console.log('decryptBackendResponse: encryptedHex =', encryptedHex);

    const [ivHex, encryptedHexData] = encryptedHex.split(':');
    if (!ivHex || !encryptedHexData) {
        throw new Error(`Invalid encrypted format: ${encryptedHex}`);
    }

    const iv = Uint8Array.from(ivHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const encryptedBuffer = Uint8Array.from(encryptedHexData.match(/.{2}/g)!.map(b => parseInt(b, 16)));

    const backendKeyHex = getBackendCryptoKey();

    const passwordBuffer = new TextEncoder().encode(backendKeyHex);
    const salt = new TextEncoder().encode('salt');

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 10000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-CTR', length: 256 },
        false,
        ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-CTR', counter: iv, length: 128 },
        derivedKey,
        encryptedBuffer
    );

    const result = new TextDecoder().decode(decryptedBuffer);
    console.log('Decrypted backend response:', result);
    return result;
}

function hexToBuffer(hex: string): ArrayBuffer {
    const len = hex.length;
    const buffer = new ArrayBuffer(len / 2);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < len; i += 2) {
        view[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return buffer;
}

export function getBackendCryptoKey(): string {
    const key = import.meta.env.VITE_BACKEND_CRYPTO_KEY;
    if (!key) {
        throw new Error('VITE_BACKEND_CRYPTO_KEY не задан в .env');
    }
    return key;
}

export async function decryptWithBackendKey(encrypted: string): Promise<string> {
    const backendKeyHex = getBackendCryptoKey();

    const [ivHex, encryptedHex] = encrypted.split(':');
    if (!ivHex || !encryptedHex) throw new Error('Invalid encrypted format');

    const iv = Uint8Array.from(ivHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
    const encryptedBuffer = Uint8Array.from(encryptedHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));

    const keyBytes = Uint8Array.from(backendKeyHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));

    if (keyBytes.length !== 16) {
        throw new Error(`Backend key must be 16 bytes (32 hex chars), got ${keyBytes.length}`);
    }

    const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-CTR' },
        false,
        ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: 'AES-CTR',
            counter: iv,
            length: 128,
        },
        key,
        encryptedBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
}

export async function decryptWithStationKeyWeb(encryptedHex: string, stationKeyHex: string): Promise<string> {
    console.log('decryptWithStationKeyWeb: encryptedHex =', encryptedHex);

    const [ivHex, encryptedHexData] = encryptedHex.split(':');
    if (!ivHex || !encryptedHexData) {
        throw new Error(`Invalid encrypted format: ${encryptedHex}`);
    }

    const iv = Uint8Array.from(ivHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const encryptedBuffer = Uint8Array.from(encryptedHexData.match(/.{2}/g)!.map(b => parseInt(b, 16)));

    if (stationKeyHex.length !== 32) {
        throw new Error(`Station key must be 32 hex chars, got ${stationKeyHex.length}`);
    }

    const passwordBuffer = new TextEncoder().encode(stationKeyHex);
    const salt = new TextEncoder().encode('salt');

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 10000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-CTR', length: 256 },
        false,
        ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-CTR', counter: iv, length: 128 },
        derivedKey,
        encryptedBuffer
    );

    const result = new TextDecoder().decode(decryptedBuffer);
    console.log('Decrypted result:', result);
    return result;
}

export async function encryptWithBackendKeyWeb(data: string): Promise<string> {
    const backendKeyHex = getBackendCryptoKey()
    const keyBytes = Uint8Array.from(
        backendKeyHex.match(/.{2}/g)!.map(b => parseInt(b, 16))
    );

    if (keyBytes.length !== 32) {
        throw new Error(`Backend key must be 32 bytes (64 hex), got ${keyBytes.length}`);
    }

    const passwordBuffer = new TextEncoder().encode(backendKeyHex);
    const salt = new TextEncoder().encode('salt');

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 10000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-CTR', length: 256 },
        false,
        ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-CTR',
            counter: iv,
            length: 128,
        },
        derivedKey,
        new TextEncoder().encode(data)
    );

    const ivHex = Array.from(iv)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    const encHex = Array.from(new Uint8Array(encryptedBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return `${ivHex}:${encHex}`;
}