import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

type LoginData = { login: string; password: string };
type VerifyData = { code: string };

export const authService = createApi({
    reducerPath: 'authService',
    baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/auth/` }),
    endpoints: (builder) => ({
        login: builder.mutation<{ message: string; userId: string }, LoginData>({
            query: (data) => ({
                url: 'login',
                method: 'POST',
                body: data,
            }),
        }),

        verifyOTP: builder.mutation<{ data: { accessToken: string } }, VerifyData>({
            query: (data) => ({
                url: 'login/verify',
                method: 'POST',
                body: data,
            }),
        }),

        whoami: builder.query<{ data: { id: string; login: string }, isSuccess: boolean }, void>({
            query: () => ({
                url: 'whoami',
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
            }),
        }),
    }),
});

export const { useLoginMutation, useVerifyOTPMutation, useWhoamiQuery } = authService;