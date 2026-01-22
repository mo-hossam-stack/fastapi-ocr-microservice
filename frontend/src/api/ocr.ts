import { apiClient } from './client';

export interface HealthResponse {
    status: string;
}

export interface ReadyResponse {
    status: string;
    tesseract_version: string;
}

export interface OCRResult {
    results: string[];
    original: string;
}

export const ocrApi = {
    checkHealth: async () => {
        const { data } = await apiClient.get<HealthResponse>('/health');
        return data;
    },

    checkReadiness: async () => {
        const { data } = await apiClient.get<ReadyResponse>('/ready');
        return data;
    },

    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await apiClient.post<OCRResult>('/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },
};
