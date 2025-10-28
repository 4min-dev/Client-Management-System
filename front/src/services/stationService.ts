import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { decryptData } from '../utils/crypto';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface StationOptionsResponse {
    calibrationChangeEvents: 0 | 1,
    fixShiftCount: 0 | 1,
    receiptCoefficient: 0 | 1,
    seasonChangeEvents: 0 | 1,
    seasonCount: 1 | 2 | 3 | 4,
    shiftChangeEvents: 0 | 1,
    selectedFuelTypes: number[],
    currencytype: string,
    currencyValue: number,
    pistolCount: number,
    procNumber: number,
    metadata: any
}

interface GetStationOptionsArgs {
    stationId: string;
    cryptoKey: string;
}

export const stationService = createApi({
    reducerPath: 'stationService',
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/station/`,
    }),
    endpoints: (builder) => ({
        getStationOptions: builder.query<StationOptionsResponse, GetStationOptionsArgs>({
            query: ({ stationId }) => ({
                url: `synchronize/crypt/${stationId}/options`,
                method: 'GET',
            }),

            transformResponse: async (rawResponse: { data: string }, _meta, arg) => {
                try {
                    return await decryptData(rawResponse.data, arg.cryptoKey);
                } catch (err: any) {
                    console.error('Ошибка расшифровки:', err);
                    throw new Error('Failed to decrypt: ' + err.message);
                }
            },
        }),
    }),
});

export const { useGetStationOptionsQuery } = stationService;