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

      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-lg p-1.5 shadow-lg shadow-indigo-500/20">
              <span className="text-xl text-white">🔍</span>
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
              OCR Service
            </h1>
          </div>
          <StatusBadge />
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 min-h-screen flex flex-col items-center">

        <div className="text-center mb-12 max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold tracking-wide uppercase shadow-sm">
            AI-Powered Extraction
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Transform Images into <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">Text</span>
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Upload any document, receipt, or screenshot. Our microservice instantly extracts the content using high-performance OCR.
          </p>
        </div>

        {error && (
          <div className="w-full max-w-xl mx-auto mb-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-xl shadow-sm flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-full shrink-0 text-red-600">
                ⚠️
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900">Extraction Failed</h3>
                <p className="text-sm text-red-700 mt-1 leading-relaxed">{error}</p>
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
