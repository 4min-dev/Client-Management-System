import { Injectable, NotFoundException } from '@nestjs/common';
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

  async cryptData(message: string, key: string) {
    const iv = randomBytes(16);
    const byteKey = (await this.deriveKey(key, 'salt', 32)) as Buffer;
    const cipher = createCipheriv('aes-256-ctr', byteKey, iv);

    const encryptedText = Buffer.concat([
      cipher.update(message),
      cipher.final(),
    ]);

    return iv.toString('hex') + ':' + encryptedText.toString('hex');
  }

  async decryptData(cryptMessage: string, key: string) {
    const [ivHex, encryptedHex] = cryptMessage.split(':');
    const byteKey = (await this.deriveKey(key, 'salt', 32)) as Buffer;

    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = createDecipheriv('aes-256-ctr', byteKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf-8');
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