import { useOCR } from './hooks/useOCR';
import { OCRUpload } from './components/OCRUpload';
import { ResultsView } from './components/ResultsView';
import { StatusBadge } from './components/StatusBadge';

function App() {
  const { uploadImage, reset, isLoading, error, data, status } = useOCR();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden relative">

      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px] mix-blend-multiply animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-400/20 blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
      </div>

      <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-2xl border-b border-slate-200/50 shadow-sm transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600 rounded-xl p-2 shadow-xl shadow-indigo-500/20 transform hover:rotate-3 transition-transform duration-300">
              <span className="text-2xl text-white">🔍</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600">
              OCR Service
            </h1>
          </div>
          <StatusBadge />
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 min-h-screen flex flex-col items-center">

        <div className="text-center mb-16 max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <span className="inline-flex items-center py-1.5 px-4 rounded-full bg-indigo-50/80 border border-indigo-100/50 text-indigo-600 text-[0.7rem] font-bold tracking-[0.2em] uppercase shadow-sm backdrop-blur-sm">
            AI-Powered Text Extraction
          </span>
          <h2 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Transform Images into <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400">Digital Text</span>
          </h2>
          <p className="text-xl text-slate-500 leading-relaxed font-medium">
            Upload any document, receipt, or screenshot. Our microservice instantly extracts the content using high-performance OCR with pixel-perfect accuracy.
          </p>
        </div>

        {error && (
          <div className="w-full max-w-2xl mx-auto mb-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="p-6 bg-red-50/60 backdrop-blur-md border border-red-200/50 rounded-2xl shadow-xl shadow-red-500/5 flex items-start gap-5">
              <div className="p-3 bg-red-100/80 rounded-xl shadow-inner text-red-600 transform hover:scale-110 transition-transform">
                <span className="text-xl">⚠️</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-red-900">Extraction Failed</h3>
                <p className="text-sm text-red-700/90 leading-relaxed font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {status === 'success' && data ? (
          <ResultsView data={data} onReset={reset} />
        ) : (
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
            <OCRUpload onUpload={uploadImage} isLoading={isLoading} />

            {isLoading && (
              <div className="mt-8 flex flex-col items-center gap-3 animate-pulse">
                <div className="h-1.5 w-48 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 animate-progress"></div>
                </div>
                <p className="text-sm font-medium text-slate-500">
                  Processing image...
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
