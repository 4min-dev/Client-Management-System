import { createApi, fetchBaseQuery, FetchBaseQueryError, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { FuelOnList, FuelType } from "../lib/types";
import { SerializedError } from "@reduxjs/toolkit";
const BASE_URL = import.meta.env.VITE_API_BASE_URL

interface ApiError {
    error: {
        message: string
    }
}

interface CustomFetchError {
    status?: number,
    data: ApiError
}

export const fuelService = createApi({
    reducerPath: 'fuelService',
    baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/fuel/` }),
    tagTypes: ['Fuel'],
    endpoints: (builder) => ({
        getFuelList: builder.query<{ data: FuelOnList[], isSuccess: boolean }, void>({
            query: () => ({
                url: 'list',
                method: 'GET'
            }),
            providesTags: ['Fuel']
        }),

        editFuel: builder.mutation<{ success: boolean, data: FuelType }, FuelType>({
            query: ({ id, name }) => ({
                url: `update`,
                body: {
                    id,
                    name
                },
                method: 'POST'
            }),
            invalidatesTags: ['Fuel']
        }),

        deleteFuel: builder.mutation<{ success: boolean, data: FuelType }, string>({
            query: (fuelId) => ({
                url: `delete/${fuelId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Fuel']
        }),

        addFuel: builder.mutation<{ success: boolean, data: FuelType }, string>({
            query: (fuelName) => ({
                url: 'create',
                method: 'PUT',
                body: {
                    name: fuelName
                }
            }),
            invalidatesTags: ['Fuel']
        })
    })
})

export const { useGetFuelListQuery, useEditFuelMutation, useDeleteFuelMutation, useAddFuelMutation } = fuelService