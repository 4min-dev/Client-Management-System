interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_CRYPTO_KEY: string;
    readonly VITE_BACKEND_CRYPTO_KEY: string;
    readonly VITE_STATION_ID: string;
    readonly VITE_MAC_ADDRESS: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}