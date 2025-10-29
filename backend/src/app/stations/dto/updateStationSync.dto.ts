export class UpdateStationSyncDto {
    fuels?: { fuelId: string }[];
    options?: {
        shiftChangeEvents?: number;
        calibrationChangeEvents?: number;
        seasonChangeEvents?: number;
        receiptCoefficient?: number;
        fixShiftCount?: number;
        seasonCount?: number;
    };
}