import { useEffect, useMemo } from 'react';
import { useGetStationKeyQuery, useGetStationOptionsQuery } from '../services/stationService';
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
    // 1. Ждём ответа от getStationKey
    const { data: getKeyData, isLoading: isKeyLoading, isFetching: isKeyFetching } = useGetStationKeyQuery(stationId);

    // 2. Определяем, нужно ли инициализировать ключ
    const shouldInitialize = getKeyData?.data?.key == null && getKeyData != null;

    // 3. Инициализируем ключ ТОЛЬКО если нужно
    const initializeResult = shouldInitialize
        ? useInitializeStationKey(stationId, true, true)
        : null;

    const stationKey = shouldInitialize && initializeResult ? initializeResult.stationKey : null;
    const isReady = shouldInitialize && initializeResult ? initializeResult.isReady : true;

    // 4. Формируем cryptoKey
    const cryptoKey = getKeyData?.data?.key ?? stationKey;

    // 5. Пропускаем запрос, пока нет ключа
    const skipOptions = !cryptoKey || isKeyLoading || (shouldInitialize && !isReady);

    const { data: optionsData, error, isFetching: isOptionsFetching } = useGetStationOptionsQuery(
        { stationId, cryptoKey: cryptoKey! },
        { skip: skipOptions }
    );

    // 6. Мемоизируем опции
    const options = useMemo((): StationOptions => {
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

    const isLoading = isKeyLoading || (shouldInitialize && !isReady) || isOptionsFetching;

    return { options, error, isLoading };
}