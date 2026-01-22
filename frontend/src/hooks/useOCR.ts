import { useState } from 'react';
import { ocrApi, type OCRResult } from '../api/ocr';
import axios from 'axios';

interface UseOCRState {
    isLoading: boolean;
    error: string | null;
    data: OCRResult | null;
    status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
}

export const useOCR = () => {
    const [state, setState] = useState<UseOCRState>({
        isLoading: false,
        error: null,
        data: null,
        status: 'idle',
    });

    const uploadImage = async (file: File) => {
        setState(prev => ({ ...prev, isLoading: true, error: null, status: 'uploading' }));

        try {
            // Simulate processing state for better UX if upload is fast
            setState(prev => ({ ...prev, status: 'processing' }));

            const result = await ocrApi.uploadImage(file);
            setState({
                isLoading: false,
                error: null,
                data: result,
                status: 'success',
            });
        } catch (err) {
            let errorMessage = 'An unexpected error occurred';

            if (axios.isAxiosError(err)) {
                if (err.response) {
                    // Map backend status codes to user messages
                    switch (err.response.status) {
                        case 401:
                            errorMessage = 'Authentication failed. Please checks your credentials.';
                            break;
                        case 413:
                            errorMessage = 'File is too large. Maximum size is 10MB.';
                            break;
                        case 415:
                            errorMessage = 'Unsupported file type. Please use PNG, JPG, or WEBP.';
                            break;
                        case 503:
                            errorMessage = 'OCR Service is currently unavailable.';
                            break;
                        case 504:
                            errorMessage = 'OCR analysis timed out. Try a simpler image.';
                            break;
                        default:
                            errorMessage = err.response.data?.detail || `Server Error (${err.response.status})`;
                    }
                } else if (err.code === 'ECONNABORTED') {
                    errorMessage = 'Request timed out. Please check your connection.';
                } else {
                    errorMessage = 'Network error. Please check if the backend is running.';
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }

            setState({
                isLoading: false,
                error: errorMessage,
                data: null,
                status: 'error',
            });
        }
    };

    const reset = () => {
        setState({
            isLoading: false,
            error: null,
            data: null,
            status: 'idle',
        });
    };

    return {
        ...state,
        uploadImage,
        reset,
    };
};
