import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const BASE_URL = import.meta.env.VITE_API_BASE_URL

export const currencyService = createApi({
    reducerPath: 'currencyService',
    baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/currency/` }),
    tagTypes: ['Rates'],
    endpoints: (builder) => ({
        getCurrencyList: builder.query<any, void>({
            query: () => ({
                url: 'list',
                method: 'GET'
            }),
            providesTags: ['Rates']
        }),

        getExchangeRates: builder.query<any, void>({
            query: () => ({
                url: 'exchangeRates/list',
                method: 'GET'
            }),
            providesTags: ['Rates']
        }),

        getPistolRates: builder.query<any, void>({
            query: () => ({
                url: 'pistolRates/list',
                method: 'GET'
            }),
            providesTags: ['Rates']
        }),

        changePistolRates: builder.mutation<any, any>({
            query: (rate) => ({
                url: 'pistolRates/update',
                method: 'POST',
                body: rate
            }),
            invalidatesTags: ['Rates']
        }),

        changeExchangeRates: builder.mutation<any, any>({
            query: (rate) => ({
                url: 'exchangeRates/update',
                method: 'POST',
                body: rate
            }),
            invalidatesTags: ['Rates']
        })
    })
})

export const { useGetCurrencyListQuery, useGetExchangeRatesQuery, useGetPistolRatesQuery, useChangePistolRatesMutation, useChangeExchangeRatesMutation } = currencyService