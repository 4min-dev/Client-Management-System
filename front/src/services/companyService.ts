import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

type SendMessageProps = {
    companyId: string;
    text: string;
};

type DeleteCompanyProps = {
    id: string;
    password: string;
};

export const companyService = createApi({
    reducerPath: 'companyService',
    baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/company/` }),
    tagTypes: ['Companies'],
    endpoints: (builder) => ({
        getCompanies: builder.query<any, void>({
            query: () => ({
                url: 'list',
                method: 'GET',
            }),
            providesTags: ['Companies'],
        }),

        sendMessage: builder.mutation<any, SendMessageProps>({
            query: ({ companyId, text }) => ({
                url: `messages/${companyId}/send`,
                method: 'POST',
                body: {
                    text,
                },
            }),
        }),

        deleteCompany: builder.mutation<any, DeleteCompanyProps>({
            query: ({ id, password }) => ({
                url: `delete/${id}`,
                method: 'DELETE',
                body: {
                    password
                },
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`
                }
            }),
            invalidatesTags: ['Companies'],
        }),

        deleteCompanyPermanent: builder.mutation<any, DeleteCompanyProps>({
            query: ({ id, password }) => ({
                url: `permanently-delete/${id}`,
                method: 'DELETE',
                body: {
                    password
                },
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`
                }
            }),
            invalidatesTags: ['Companies'],
        }),
    }),
});

export const {
    useGetCompaniesQuery,
    useSendMessageMutation,
    useDeleteCompanyMutation,
    useDeleteCompanyPermanentMutation,
} = companyService;