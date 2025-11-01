const API_URL = import.meta.env.VITE_API_BASE_URL

export async function getServerMacAddress() {
    try {
        const response = await fetch(`${API_URL}/network/mac`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('MAC-адрес сервера:', data.data.mac);
        return data.data.mac;
    } catch (error) {
        console.error('Ошибка при получении MAC:', error);
        return null;
    }
}

export async function getCryptoKey(): Promise<{ isSuccess: boolean, data: string } | null> {
    try {
        const response = await fetch(`${API_URL}/crypto/key`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data)
        return data
    } catch (error) {
        console.error('Ошибка при получении MAC:', error);
        return null;
    }
}