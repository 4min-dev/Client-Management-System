import { configureStore } from "@reduxjs/toolkit";
import { authService } from "./src/services/authService";

export default function setupStore() {
    return configureStore({
        reducer: {
            [authService.reducerPath]: authService.reducer
        },
        middleware:(getDefaultMiddleware) => getDefaultMiddleware().concat(
            authService.middleware
        ) 
    })
}