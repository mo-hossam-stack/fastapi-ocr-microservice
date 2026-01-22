import React, { useCallback, useState } from 'react';
import { clsx } from 'clsx';

interface OCRUploadProps {
    onUpload: (file: File) => void;
    isLoading: boolean;
}

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const OCRUpload: React.FC<OCRUploadProps> = ({ onUpload, isLoading }) => {
    const [dragActive, setDragActive] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return 'Formato inválido. Use PNG, JPG o WEBP.';
        }
        if (file.size > MAX_SIZE_BYTES) {
            return `Arquivo muito grande. Max ${MAX_SIZE_MB}MB.`;
        }
        return null;
    };

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        const error = validateFile(file);

        if (error) {
            setValidationError(error);
            return;
        }

        setValidationError(null);
        onUpload(file);
    };

    const onDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    return (
        <div className="w-full max-w-xl mx-auto relative group">
            {/* Glow Effect */}
            <div className={clsx(
                "absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500",
                dragActive && "opacity-60 blur-md"
            )}></div>

            <div
                className={clsx(
                    "relative bg-white/80 backdrop-blur-xl border-2 rounded-xl p-12 text-center transition-all duration-300 ease-out cursor-pointer shadow-xl",
                    dragActive
                        ? "border-indigo-500 bg-indigo-50/50 scale-[1.02]"
                        : "border-slate-200/60 hover:border-indigo-300 hover:shadow-2xl",
                    isLoading && "opacity-50 pointer-events-none grayscale"
                )}
                onDragEnter={onDrag}
                onDragLeave={onDrag}
                onDragOver={onDrag}
                onDrop={onDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
            >
                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={handleChange}
                    disabled={isLoading}
                    aria-label="Upload image"
                />

                <div className="space-y-6">
                    <div className={clsx(
                        "w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 flex items-center justify-center text-4xl shadow-inner transition-transform duration-300",
                        dragActive ? "scale-110 rotate-12" : "group-hover:scale-105"
                    )}>
                        <span className="drop-shadow-sm">📄</span>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-800">
                            {isLoading ? 'Uploading...' : 'Upload Document'}
                        </h3>
                        <p className="text-slate-500 font-medium">
                            Drag & drop or <span className="text-indigo-600 underline underline-offset-2">browse</span>
                        </p>
                        <p className="text-xs text-slate-400 font-mono pt-2">
                            SUPPORTED: PNG, JPG, WEBP (MAX 10MB)
                        </p>
                    </div>
                </div>
            </div>

            {validationError && (
                <div className="absolute top-full left-0 right-0 mt-4 p-4 bg-red-50/90 backdrop-blur border border-red-200 text-red-700 rounded-xl text-sm shadow-lg animate-in slide-in-from-top-2 text-center font-medium">
                    {validationError}
                </div>
            )}
        </div>
    );
};
