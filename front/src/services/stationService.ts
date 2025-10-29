import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { decryptData, encryptData } from '../utils/crypto';
import { Fuel, Station } from '../lib/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface StationOptionsResponse {
    calibrationChangeEvents: 0 | 1;
    fixShiftCount: 0 | 1;
    receiptCoefficient: 0 | 1;
    seasonChangeEvents: 0 | 1;
    seasonCount: 1 | 2 | 3 | 4;
    shiftChangeEvents: 0 | 1;
    selectedFuelTypes: number[];
    currencytype: string;
    currencyValue: number;
    pistolCount: number;
    procNumber: number;
    metadata: any;
}

interface GetStationOptionsArgs {
    stationId: string;
    cryptoKey: string;
}

interface UpdateStationSyncArgs {
    stationId: string;
    cryptoKey: string;
    payload: {
        fuels?: Fuel[];
        options?: {
            shiftChangeEvents?: number;
            calibrationChangeEvents?: number;
            seasonChangeEvents?: number;
            receiptCoefficient?: number;
            fixShiftCount?: number;
            seasonCount?: number;
        };
    };
}

interface StationForAddResponse {
    companyName: string;
    country: string;
    city: string;
    address: string;
    procCount: number;
    pistolCount: number;
    currencyType: string;
    discount: number;
    ownerCompanyName: string;
    ownerCompanyDescription: string;
    contactName: string;
    contactDescription: string;
    ownerValue?: string;
    responsibleValue?: string;
}

export const stationService = createApi({
    reducerPath: 'stationService',
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/station/`,
        prepareHeaders: (headers) => {
            const token = sessionStorage.getItem('accessToken');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Stations'],
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
            providesTags: ['Stations']
        }),

        updateStationSync: builder.mutation<{ success: boolean }, UpdateStationSyncArgs>({
            query: ({ stationId, cryptoKey, payload }) => {
                const encrypted = encryptData(JSON.stringify(payload), cryptoKey);
                return {
                    url: `synchronize/crypt/${stationId}/update`,
                    method: 'PATCH',
                    body: { data: encrypted },
                };
            },
            invalidatesTags: ['Stations']
        }),

        deleteStation: builder.mutation<{ success: boolean }, { stationId: string; password: string }>({
            query: ({ stationId, password }) => ({
                url: `delete/${stationId}`,
                method: 'DELETE',
                body: { password },
            }),
            invalidatesTags: ['Stations'],
        }),

        addStation: builder.mutation<any, StationForAddResponse>({
            query: (station) => ({
                url: 'create',
                method: 'PUT',
                body: station
            }),
            invalidatesTags: ['Stations'],
        })
    }),
});

export const {
    useGetStationOptionsQuery,
    useUpdateStationSyncMutation,
    useDeleteStationMutation,
    useAddStationMutation
} = stationService;