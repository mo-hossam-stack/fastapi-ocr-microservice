import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as ocrApiModule from './api/ocr';
import axios from 'axios';

// Mock the API module
vi.mock('./api/ocr', () => ({
    ocrApi: {
        checkHealth: vi.fn(),
        checkReadiness: vi.fn(),
        uploadImage: vi.fn(),
    },
}));

describe('App Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mocks
        (ocrApiModule.ocrApi.checkHealth as any).mockResolvedValue({ status: 'ok' });
        (ocrApiModule.ocrApi.checkReadiness as any).mockResolvedValue({ status: 'ready', tesseract_version: '5.0' });
    });

    it('renders initial dashboard and health status', async () => {
        render(<App />);
        expect(screen.getByText(/OCR Service/i)).toBeInTheDocument();

        // Status Badge checks (polling happens on mount)
        await waitFor(() => {
            // Match the 'OK' text directly which is always visible
            expect(screen.getByText(/^OK$/)).toBeInTheDocument();
        });
    });

    it('handles successful upload flow', async () => {
        const mockData = { results: ['Line 1', 'Line 2'], original: 'Line 1\nLine 2' };
        (ocrApiModule.ocrApi.uploadImage as any).mockResolvedValue(mockData);

        render(<App />);

        // Find upload input
        const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
        const input = screen.getByLabelText(/Upload image/i);

        // Upload
        fireEvent.change(input, { target: { files: [file] } });

        // Loading state
        expect(screen.getByText(/Processing image/i)).toBeInTheDocument();

        // Success state
        await waitFor(() => {
            expect(screen.getByText(/Analysis Results/i)).toBeInTheDocument();
            expect(screen.getByText('Line 1')).toBeInTheDocument();
        });
    });

    it('displays error on API failure (503)', async () => {
        const error = new axios.AxiosError('Service Unavailable', '503', {} as any, {}, {
            status: 503,
            data: { detail: 'Service Unavailable' },
            statusText: 'Service Unavailable',
            headers: {},
            config: {} as any,
        });

        (ocrApiModule.ocrApi.uploadImage as any).mockRejectedValue(error);

        render(<App />);

        const file = new File(['dummy'], 'test.png', { type: 'image/png' });
        const input = screen.getByLabelText(/Upload image/i);

        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText(/Extraction Failed/i)).toBeInTheDocument();
        });
    });

    it('validates file size before upload', async () => {
        render(<App />);

        // 11MB file
        const largeFile = {
            name: 'large.png',
            size: 11 * 1024 * 1024,
            type: 'image/png',
        } as unknown as File;

        const input = screen.getByLabelText(/Upload image/i);

        // We can't easily construct a real 11MB file data in jsdom safely, but we mock the object properties
        fireEvent.change(input, { target: { files: [largeFile] } });

        await waitFor(() => {
            // Match Portuguese text from UI
            expect(screen.getByText(/Arquivo muito grande/i)).toBeInTheDocument();
        });

        // Ensure API was NOT called
        expect(ocrApiModule.ocrApi.uploadImage).not.toHaveBeenCalled();
    });
});
