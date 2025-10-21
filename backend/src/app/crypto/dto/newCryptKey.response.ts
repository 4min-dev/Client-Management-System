export class CryptKeyResponse {
  key: String;
  expiredAt: Date;

  constructor(newKey: String, expiredAt: Date) {
    this.key = newKey;
    this.expiredAt = expiredAt;
  }
}
