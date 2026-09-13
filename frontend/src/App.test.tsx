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
        expect(screen.getAllByText(/RETRO/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/MODEL 1978/i).length).toBeGreaterThan(0);

        await waitFor(() => {
            expect(screen.getByText(/SYS:/i)).toBeInTheDocument();
        });
    });

    it('handles successful upload flow', async () => {
        const mockData = { results: ['Line 1', 'Line 2'], original: 'Line 1\nLine 2' };
        (ocrApiModule.ocrApi.uploadImage as any).mockResolvedValue(mockData);

        render(<App />);

        const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
        const input = screen.getByLabelText(/Upload image/i);

        fireEvent.change(input, { target: { files: [file] } });

        // click EXTRACT to trigger upload (retro requires explicit action)
        const extractBtn = await screen.findByText(/EXTRACT TEXT/i);
        fireEvent.click(extractBtn);

        // loading state shows SCANNING
        await waitFor(() => {
            expect(screen.getByText(/SCANNING/i)).toBeInTheDocument();
        });
        // Success state
        await waitFor(() => {
            // textarea contains editable original; search by display value
            const ta = screen.getByDisplayValue(/Line 1/);
            expect(ta).toBeInTheDocument();
            expect(screen.getByText(/OUTPUT — TEXT/i)).toBeInTheDocument();
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
        const extractBtn = await screen.findByText(/EXTRACT TEXT/i);
        fireEvent.click(extractBtn);

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
            expect(screen.getByText(/File too large/i)).toBeInTheDocument();
        });

        // Ensure API was NOT called
        expect(ocrApiModule.ocrApi.uploadImage).not.toHaveBeenCalled();
    });
});
