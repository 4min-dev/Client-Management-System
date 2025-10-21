import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
const BASE_URL = import.meta.env.VITE_API_BASE_URL

type UserAuthData = {
    login: string,
    password: string
}

export const authService = createApi({
    reducerPath: 'authService',
    baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/auth/` }),
    endpoints: (builder) => ({
        login: builder.mutation<any, UserAuthData>({
            query: (user) => ({
                url: 'login',
                method: 'POST',
                body: user
            })
        }),

        userAuth: builder.query<any, void>({
            query: () => ({
                url: 'whoami',
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`
                }
            })
        }),

        generate2fa: builder.query<any, void>({
            query: () => ({
                url: '2fa/generate',
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`
                }
            })
        })
    })
})

export const { useLoginMutation, useGenerate2faQuery, useUserAuthQuery } = authService