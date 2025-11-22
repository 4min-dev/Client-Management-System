import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { Fuel } from '../lib/types';
import { decryptBackendResponse, decryptWithStationKeyWeb, encryptWithBackendKeyWeb, encryptWithStationKeyWeb } from '../utils/crypto';
import { getServerMacAddress } from '../utils/network';

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
            if (token) headers.set('Authorization', `Bearer ${token}`);
            headers.set('Content-Type', 'application/json');
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
                    console.log('transform:', response.data)
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
            async queryFn({ stationId, payload }, { dispatch, getState }) {
                let stationKey: string | null = null;
                let keyExpiredAt: string | null = null;

                try {
                    // === 1. Сначала: пробуем получить ключ с сервера ===
                    const keyResponse = await fetch(`${BASE_URL}/crypto/key/${stationId}`, {
                        method: "GET",
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
                        },
                    });

                    if (keyResponse.ok) {
                        const json = await keyResponse.json();
                        if (json?.data?.key && json?.data?.expiredAt) {
                            stationKey = json.data.key;
                            keyExpiredAt = json.data.expiredAt;

                            // Проверяем, не истёк ли ключ
                            if (new Date(keyExpiredAt) > new Date()) {
                                localStorage.setItem(`STATION_CRYPTO_KEY_${stationId}`, stationKey);
                                localStorage.setItem(`STATION_KEY_EXPIRES_${stationId}`, keyExpiredAt);
                                console.log('Ключ получен с сервера и валиден');
                            } else {
                                console.log('Ключ с сервера истёк, попробуем localStorage или инициализацию');
                                stationKey = null; // Сбросим, чтобы пойти дальше
                            }
                        }
                    } else if (keyResponse.status !== 404) {
                        console.warn('Ошибка при получении ключа с сервера:', keyResponse.status);
                    }

                    // === 2. Если ключа нет с сервера — пробуем localStorage ===
                    if (!stationKey) {
                        const savedKey = localStorage.getItem(`STATION_CRYPTO_KEY_${stationId}`);
                        const savedExpires = localStorage.getItem(`STATION_KEY_EXPIRES_${stationId}`);

                        if (savedKey && savedExpires && new Date(savedExpires) > new Date()) {
                            stationKey = savedKey;
                            keyExpiredAt = savedExpires;
                            console.log('Ключ взят из localStorage');
                        } else {
                            // Удаляем устаревший ключ
                            localStorage.removeItem(`STATION_CRYPTO_KEY_${stationId}`);
                            localStorage.removeItem(`STATION_KEY_EXPIRES_${stationId}`);
                        }
                    }

                    // === 3. Если ключа всё ещё нет — инициализируем по MAC ===
                    if (!stationKey) {
                        console.log('Ключ не найден — инициализируем по MAC');
                        const macAddress = await getServerMacAddress();
                        const initPayload = JSON.stringify({ stationId, macAddress });
                        const encrypted = await encryptWithBackendKeyWeb(initPayload);

                        const initResponse = await fetch(`${BASE_URL}/crypto/key`, {
                            method: "POST",
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
                            },
                            body: JSON.stringify({ data: encrypted }),
                        });

                        if (!initResponse.ok) {
                            const errText = await initResponse.text();
                            throw new Error(`Инициализация ключа не удалась: ${errText}`);
                        }

                        const initJson = await initResponse.json();
                        if (!initJson?.isSuccess || !initJson?.data) {
                            throw new Error('Некорректный ответ при инициализации ключа');
                        }

                        const decrypted = await decryptBackendResponse(initJson.data);
                        const keyData = JSON.parse(decrypted);

                        stationKey = keyData.key;
                        keyExpiredAt = keyData.expiredAt;

                        localStorage.setItem(`STATION_CRYPTO_KEY_${stationId}`, stationKey);
                        localStorage.setItem(`STATION_KEY_EXPIRES_${stationId}`, keyExpiredAt);
                        console.log('Ключ успешно инициализирован по MAC');
                    }

                    // === 4. Шифруем и отправляем payload ===
                    const json = JSON.stringify(payload);
                    const encryptedPayload = await encryptWithStationKeyWeb(json, stationKey!);

                    const response = await fetch(`${BASE_URL}/station/synchronize/crypt/${stationId}/update`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
                        },
                        body: JSON.stringify({ data: encryptedPayload }),
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        return { error: { status: response.status, data: errText } as FetchBaseQueryError };
                    }

                    return { data: { success: true } };

                } catch (err: any) {
                    return {
                        error: {
                            status: 'CUSTOM_ERROR',
                            data: err.message || 'Неизвестная ошибка при обновлении станции'
                        } as FetchBaseQueryError
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

        initializeStationKey: builder.mutation<
            { key: string; expiredAt: string },
            { stationId: string; macAddress: string }
        >({
            async queryFn({ stationId, macAddress }) {
                try {
                    const payload = JSON.stringify({ stationId, macAddress });
                    const encrypted = await encryptWithBackendKeyWeb(payload);

                    const response = await fetch(`${BASE_URL}/crypto/key`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
                        },
                        body: JSON.stringify({ data: encrypted }),
                    });

                    if (!response.ok) throw new Error(await response.text());

                    const result = await response.json();

                    console.log('RAW RESPONSE:', result);
                    console.log('result.data:', result.data);

                    if (result.isSuccess && result.data) {
                        const decrypted = await decryptBackendResponse(result.data);
                        return { data: JSON.parse(decrypted) };
                    }

                    throw new Error('Invalid response format');
                } catch (err: any) {
                    return { error: { status: 'CUSTOM_ERROR', data: err.message } };
                }
            },
        }),

        getStationKey: builder.query<{ data: { key: string; expiredAt: string } }, string>({
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
            async queryFn({ stationId, newMacAddress }) {
                try {
                    const currentMac = await getServerMacAddress();
                    const payload: any = { stationId };
                    console.log('New mac address:', newMacAddress)
                    console.log('Current mac address:', currentMac)

                    const oldKey = localStorage.getItem(`STATION_CRYPTO_KEY_${stationId}`);
                    if (!oldKey) throw new Error('Старый ключ не найден');
                    payload.key = oldKey;


                    if (newMacAddress) payload.macAddress = newMacAddress;

                    console.log('payload', payload)
                    const encrypted = await encryptWithBackendKeyWeb(JSON.stringify(payload));

                    const response = await fetch(`${BASE_URL}/crypto/key`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
                        },
                        body: JSON.stringify({ data: encrypted }),
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        throw new Error(errText);
                    }

                    const result = await response.json();
                    if (!result.isSuccess || !result.data) throw new Error('Invalid response');

                    const decrypted = await decryptBackendResponse(result.data);
                    const parsed = JSON.parse(decrypted);

                    localStorage.setItem(`STATION_CRYPTO_KEY_${stationId}`, parsed.key);
                    localStorage.setItem(`STATION_KEY_EXPIRES_${stationId}`, parsed.expiredAt);

                    return { data: parsed };
                } catch (err: any) {
                    return { error: { status: 'CUSTOM_ERROR', data: err.message } };
                }
            },
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