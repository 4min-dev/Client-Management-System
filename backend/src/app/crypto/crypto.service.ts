import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, pbkdf2, randomBytes } from 'crypto';
import { promisify } from 'util';
import { compare, hash } from 'bcrypt';
import prisma from 'prisma/prisma';

@Injectable()
export class CryptoService {
  constructor() { }

  async generateKey(length: number = 32) {
    const bytes = randomBytes(Math.ceil(length / 2));
    return bytes.toString('hex').slice(0, length);
  }

  async deriveKey(
    password: string,
    salt: string = 'salt',
    keyLen: number = 32,
  ): Promise<Buffer> {
    return await promisify(pbkdf2)(password, salt, 10000, keyLen, 'sha256');
  }

  async cryptData(message: string, key: string): Promise<string> {
    const iv = randomBytes(16);

    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 16) {
      throw new BadRequestException(`Key must be 16 bytes (32 hex chars), got ${keyBuffer.length}`);
    }

    const cipher = createCipheriv('aes-128-ctr', keyBuffer, iv);

    const encrypted = Buffer.concat([
      cipher.update(message, 'utf8'),
      cipher.final(),
    ]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  async decryptData(encrypted: string, key: string): Promise<string> {
    console.log('decryptData: encrypted =', encrypted);
    console.log('decryptData: key =', key);

    const [ivHex, encryptedHex] = encrypted.split(':');
    if (!ivHex || !encryptedHex) {
      throw new BadRequestException(`Invalid format: ${encrypted}`);
    }

    const iv = Buffer.from(ivHex, 'hex');
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex');

    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 16) {
      throw new BadRequestException(`Key must be 16 bytes, got ${keyBuffer.length}`);
    }

    const decipher = createDecipheriv('aes-128-ctr', keyBuffer, iv);

    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);

    const result = decrypted.toString('utf8');
    console.log('Decrypted result:', result);
    return result;
  }

  async verifyPassword(password: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return compare(password, user.password);
  }

  async hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }
}