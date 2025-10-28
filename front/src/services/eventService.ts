import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const BASE_URL = import.meta.env.VITE_API_BASE_URL

type GetEventsProps = {
    stationId?: string,
}

export const eventService = createApi({
    reducerPath: 'eventService',
    baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/events` }),
    tagTypes: ['Events'],
    endpoints: (builder) => ({
        getEvents: builder.query<any, GetEventsProps>({
            query: ({ stationId }) => ({
                url: `?stationId=${stationId}`,
                method: 'GET',
            }),
            providesTags: (result, error, { stationId }) => [{ type: 'Events', id: stationId }],
        }),

        makeAsRead: builder.mutation<any, string>({
            query: (eventId) => ({
                url: `/${eventId}/view`,
                method: 'PATCH'
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Events' }],
        })
    })
})

export const { useGetEventsQuery, useMakeAsReadMutation } = eventService