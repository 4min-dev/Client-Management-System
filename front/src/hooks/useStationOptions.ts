import { useEffect, useMemo } from 'react';
import { useGetStationOptionsQuery } from '../services/stationService';
import { useInitializeStationKey } from './useInitializeStationKey';

interface StationOptions {
    shiftChangeEvents: 0 | 1;
    calibrationChangeEvents: 0 | 1;
    seasonChangeEvents: 0 | 1;
    receiptCoefficient: 0 | 1;
    fixShiftCount: 0 | 1;
    seasonCount: number;
    fuelTypeCount: number;
}

export function useStationOptions(stationId: string) {
    const { stationKey, isReady } = useInitializeStationKey(stationId, true);
    const { data: optionsData, error } = useGetStationOptionsQuery(
        { stationId, cryptoKey: stationKey! }
    );

    const options = useMemo((): StationOptions => {
        console.log(optionsData)
        if (!optionsData) {

            return {
                shiftChangeEvents: 0,
                calibrationChangeEvents: 0,
                seasonChangeEvents: 0,
                receiptCoefficient: 0,
                fixShiftCount: 0,
                seasonCount: 1,
                fuelTypeCount: 0,
            };
        }

        return {
            shiftChangeEvents: optionsData.shiftChangeEvents || 0,
            calibrationChangeEvents: optionsData.calibrationChangeEvents || 0,
            seasonChangeEvents: optionsData.seasonChangeEvents || 0,
            receiptCoefficient: optionsData.receiptCoefficient || 0,
            fixShiftCount: optionsData.fixShiftCount || 0,
            seasonCount: optionsData.seasonCount || 1,
            fuelTypeCount: optionsData.selectedFuelTypes?.length || 0,
        };
    }, [optionsData]);

    return { options, error };
}