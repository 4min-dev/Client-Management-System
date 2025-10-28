const crypto = require('crypto');
const { promisify } = require('util');
const pbkdf2 = promisify(crypto.pbkdf2);

async function deriveKey(password, salt = 'salt', keyLen = 32) {
    return await pbkdf2(password, salt, 10000, keyLen, 'sha256');
}

async function encryptData(message, key) {
    const iv = crypto.randomBytes(16);
    const byteKey = await deriveKey(key, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-ctr', byteKey, iv);

    const encrypted = Buffer.concat([
        cipher.update(message, 'utf8'),
        cipher.final(),
    ]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// === ТВОИ ДАННЫЕ ===
const CRYPTO_KEY = '3901c991783353e98e1e39d54ad5a1fc'; // ← ВСТАВЬ СЮДА!
const payload = {
    stationId: '154949be-4365-4d38-86ac-24caf4368d8c',
    macAddress: '00:1A:2B:3C:4D:5E'
};

encryptData(JSON.stringify(payload), CRYPTO_KEY)
    .then(encrypted => {
        console.log('Зашифрованный payload:');
        console.log(encrypted);
    });