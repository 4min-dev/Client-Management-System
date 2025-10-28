import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const BASE_URL = import.meta.env.VITE_API_BASE_URL

export const fuelService = createApi({
    reducerPath: 'fuelService',
    baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/fuel/` }),
    endpoints: (builder) => ({
        getFuelList: builder.query<any, void>({
            query: () => ({
                url: 'list',
                method: 'GET'
            })
        })
    })
})

export const { useGetFuelListQuery } = fuelService