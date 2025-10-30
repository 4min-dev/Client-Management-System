import { configureStore } from "@reduxjs/toolkit";
import { authService } from "./src/services/authService";
import { companyService } from "./src/services/companyService";
import { eventService } from "./src/services/eventService";
import userSlice from "./src/slices/userSlice";
import { stationService } from "./src/services/stationService";
import { fuelService } from "./src/services/fuelService";
import { currencyService } from "./src/services/currencyService";

export default function setupStore() {
    return configureStore({
        reducer: {
            userSlice: userSlice.reducer,
            [authService.reducerPath]: authService.reducer,
            [companyService.reducerPath]: companyService.reducer,
            [eventService.reducerPath]: eventService.reducer,
            [stationService.reducerPath]: stationService.reducer,
            [fuelService.reducerPath]: fuelService.reducer,
            [currencyService.reducerPath]: currencyService.reducer
        },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(
            authService.middleware,
            companyService.middleware,
            eventService.middleware,
            stationService.middleware,
            fuelService.middleware,
            currencyService.middleware
        )
    })
}