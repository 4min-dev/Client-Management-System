export class SynchronizeLicenseDto {
  expiredAt: Date;
  currentTime: Date;

  constructor(expiredAt: Date, currentTime: Date) {
    this.expiredAt = expiredAt;
    this.currentTime = currentTime;
  }
}
