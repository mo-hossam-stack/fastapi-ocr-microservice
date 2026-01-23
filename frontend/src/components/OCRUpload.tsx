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
        <div className="w-full max-w-2xl mx-auto relative group">
            {/* Glow Effect */}
            <div className={clsx(
                "absolute -inset-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-1000",
                dragActive && "opacity-50 blur-xl"
            )}></div>

            <div
                className={clsx(
                    "relative bg-white/60 backdrop-blur-2xl border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-500 ease-out cursor-pointer shadow-2xl",
                    dragActive
                        ? "border-indigo-500 bg-indigo-50/30 scale-[1.02] shadow-indigo-500/10"
                        : "border-slate-200/50 hover:border-indigo-300/50 hover:shadow-indigo-500/5",
                    isLoading && "opacity-50 pointer-events-none grayscale blur-sm"
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

                <div className="space-y-8">
                    <div className={clsx(
                        "w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50/50 flex items-center justify-center text-5xl shadow-inner border border-white/50 transition-all duration-500",
                        dragActive ? "scale-110 rotate-6 shadow-indigo-200" : "group-hover:scale-105 group-hover:-rotate-3"
                    )}>
                        <span className="drop-shadow-lg filter group-hover:drop-shadow-indigo-500/20">📄</span>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                            {isLoading ? 'Processing...' : 'Upload Document'}
                        </h3>
                        <p className="text-slate-500 font-medium text-lg">
                            Drag & drop or <span className="text-indigo-600 underline underline-offset-4 decoration-2 decoration-indigo-200 hover:decoration-indigo-500 transition-all">browse files</span>
                        </p>
                        <div className="pt-4 flex items-center justify-center gap-4">
                            <span className="px-3 py-1 bg-slate-100/50 rounded-lg text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest border border-slate-200/50">PNG, JPG, WEBP</span>
                            <span className="px-3 py-1 bg-indigo-50/50 rounded-lg text-[0.65rem] font-bold text-indigo-400 uppercase tracking-widest border border-indigo-100/50">MAX 10MB</span>
                        </div>
                    </div>
                </div>
            </div>

            {validationError && (
                <div className="absolute -bottom-16 left-0 right-0 p-4 bg-red-50/90 backdrop-blur-xl border border-red-200/50 text-red-700 rounded-2xl text-sm shadow-2xl shadow-red-500/10 animate-in slide-in-from-top-4 duration-500 text-center font-bold flex items-center justify-center gap-2">
                    <span className="bg-red-100 p-1 rounded-full text-xs">⚠️</span>
                    {validationError}
                </div>
            )}
        </div>
    );
};
