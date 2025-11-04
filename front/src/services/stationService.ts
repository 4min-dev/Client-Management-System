import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { Fuel } from '../lib/types';
import { decryptBackendResponse, decryptWithStationKeyWeb, encryptWithStationKeyWeb } from '../utils/crypto';

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
        baseUrl: `${BASE_URL}`,
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
                url: `/station/synchronize/crypt/${stationId}/options`,
                method: 'GET',
            }),
            async transformResponse(response: { data: string }, meta, arg) {
                try {
                    const decrypted = await decryptWithStationKeyWeb(response.data, arg.cryptoKey);
                    console.log('Decrypted options:', decrypted);
                    return JSON.parse(decrypted);
                } catch (err) {
                    console.error('Failed to decrypt options:', err);
                    throw err;
                }
            },
            providesTags: ['Stations']
        }),

        updateStationSync: builder.mutation<{ success: boolean }, UpdateStationSyncArgs>({
            async queryFn({ stationId, cryptoKey, payload }, { signal }) {
                try {
                    const json = JSON.stringify(payload);
                    const encrypted = await encryptWithStationKeyWeb(json, cryptoKey);

                    const response = await fetch(`${BASE_URL}/station/synchronize/crypt/${stationId}/update`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
                        },
                        body: JSON.stringify({ data: encrypted }),
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        return {
                            error: {
                                status: response.status,
                                statusText: response.statusText,
                                data: errText,
                            } as FetchBaseQueryError,
                        };
                    }

                    return { data: { success: true } };
                } catch (err: any) {
                    return {
                        error: {
                            status: 'CUSTOM_ERROR' as const,
                            statusText: 'Encryption/Network Error',
                            data: err.message,
                            error: err.message,
                        } as FetchBaseQueryError,
                    };
                }
            },
            invalidatesTags: ['Stations']
        }),


        deleteStation: builder.mutation<{ success: boolean }, { stationId: string; password: string }>({
            query: ({ stationId, password }) => ({
                url: `/station/delete/${stationId}`,
                method: 'DELETE',
                body: { password },
            }),
            invalidatesTags: ['Stations'],
        }),

        addStation: builder.mutation<any, StationForAddResponse>({
            query: (station) => ({
                url: '/station/create',
                method: 'PUT',
                body: station
            }),
            invalidatesTags: ['Stations'],
        }),

        updateStation: builder.mutation<any, any>({
            query: (data) => ({
                url: `/station/update/${data.stationId}`,
                method: 'PATCH',
                body: data
            }),
            invalidatesTags: ['Stations']
        }),

        initializeStationKey: builder.mutation<{ data: { data: string } }, { stationId: string; macAddress: string }>({
            query: ({ stationId, macAddress }) => {
                const payload = { stationId, macAddress };
                const base64 = btoa(JSON.stringify(payload));

                return {
                    url: '/crypto/key',
                    method: 'POST',
                    body: { data: base64 },
                };
            },
        }),

        getStationKey: builder.query<{ key: string; expiredAt: string }, string>({
            query: (stationId) => ({
                url: `/crypto/key/${stationId}`,
                method: 'GET',
            }),
            providesTags: (result, error, stationId) => [{ type: 'Stations', id: stationId }],
        }),

        resetStationMac: builder.mutation<
            { key: string; expiredAt: string },
            { stationId: string; newMacAddress?: string }
        >({
            async queryFn({ stationId, newMacAddress }, { dispatch }) {
                try {
                    const keyResult = await dispatch(
                        stationService.endpoints.getStationKey.initiate(stationId, { forceRefetch: true })
                    ).unwrap();

                    console.log('Текущий ключ станции:', keyResult.data.key);

                    const payload = {
                        stationId,
                        macAddress: newMacAddress,
                        key: keyResult.data.key,
                    };
                    const base64Payload = btoa(JSON.stringify(payload));

                    const response = await fetch(`${BASE_URL}/crypto/key`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
                        },
                        body: JSON.stringify({ data: base64Payload }),
                    });

                    if (!response.ok) throw new Error(await response.text());

                    const result = await response.json();
                    console.log('Backend response:', result);

                    const encryptedHex = result.data.data;
                    const decrypted = await decryptBackendResponse(encryptedHex);
                    console.log('Расшифровано (RAW):', decrypted);

                    let parsed;
                    try {
                        parsed = JSON.parse(decrypted);
                        console.log('Успешно распарсено:', parsed);
                    } catch (e) {
                        console.error('НЕ JSON:', decrypted);
                        throw new Error('Сервер вернул невалидный JSON');
                    }

                    return { data: parsed };
                } catch (err: any) {
                    console.error('Ошибка сброса MAC:', err);
                    return {
                        error: {
                            status: 'CUSTOM_ERROR' as const,
                            statusText: 'MAC Reset Failed',
                            error: err.message,
                            data: err.message,
                        } as FetchBaseQueryError,
                    };
                }
            },
            invalidatesTags: ['Stations'],
        }),
    }),
});

export const {
    useGetStationOptionsQuery,
    useUpdateStationSyncMutation,
    useDeleteStationMutation,
    useAddStationMutation,
    useUpdateStationMutation,
    useInitializeStationKeyMutation,
    useGetStationKeyQuery,
    useResetStationMacMutation
} = stationService;