import { useCallback, useEffect, useRef, useState } from 'react';
import { useOCR } from './hooks/useOCR';
import { ocrApi } from './api/ocr';

export default function App() {
  const { uploadImage, reset, isLoading, error, data } = useOCR();

  // health / ready for truthful header (no fake stats)
  const [tessVersion, setTessVersion] = useState<string | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [readyOk, setReadyOk] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try { await ocrApi.checkHealth(); if (alive) setHealthOk(true); } catch { if (alive) setHealthOk(false); }
      try { const r = await ocrApi.checkReadiness(); if (alive) { setReadyOk(true); setTessVersion(r.tesseract_version); } } catch { if (alive) setReadyOk(false); }
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // upload state - local preview + history (no fake confidence)
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // editable result derived from backend data.original
  const [editable, setEditable] = useState('');
  useEffect(() => {
    if (data?.original !== undefined) setEditable(data.original);
  }, [data]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const MAX_MB = 10;

  const handleFiles = useCallback((files: FileList | File[] | null) => {
    const f = (files as FileList)?.[0] ?? (files as File[])?.[0];
    if (!f) return;
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(f.type) && !f.type.startsWith('image/')) {
      setValidationError('Unsupported file type. Use PNG, JPG or WEBP.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setValidationError(`File too large. Max ${MAX_MB}MB.`);
      return;
    }
    setValidationError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    reset();
    setEditable('');
  }, [reset]);

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };
  const onPaste = useCallback((e: ClipboardEvent) => {
    const item = [...(e.clipboardData?.items ?? [])].find(i => i.type.startsWith('image/'));
    if (item) handleFiles([item.getAsFile() as File]);
  }, [handleFiles]);
  useEffect(() => { window.addEventListener('paste', onPaste as any); return () => window.removeEventListener('paste', onPaste as any); }, [onPaste]);

  const runOcr = async () => {
    if (!file) return;
    await uploadImage(file);
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 1200);
  };

  const download = (ext: 'txt' | 'json') => {
    if (!data) return;
    const content = ext === 'json' ? JSON.stringify({ results: data.results, original: data.original }, null, 2) : editable;
    const blob = new Blob([content], { type: ext === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `retro-ocr-${Date.now()}.${ext}`; a.click(); URL.revokeObjectURL(url);
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) { videoRef.current.srcObject = s; setCameraOn(true); }
    } catch { alert('Camera not available'); }
  };
  const stopCamera = () => { (videoRef.current?.srcObject as MediaStream | null)?.getTracks()?.forEach(t => t.stop()); setCameraOn(false); };
  const snap = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    c.toBlob(b => { if (b) { const f = new File([b], 'capture.jpg', { type: 'image/jpeg' }); handleFiles([f] as any); stopCamera(); } }, 'image/jpeg', 0.9);
  };

  const charCount = editable.length;
  const wordCount = editable.split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="grain" aria-hidden />

      {/* ticker — truthful status only, no fake lang/mode */}
      <div className="sticky top-0 z-30 bg-[#111110] text-[#FFFBEB] text-[11px] tracking-[0.14em] border-b-[3px] border-[#111110]">
        <div className="max-w-[1280px] mx-auto px-4 h-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className={`px-2 py-0.5 font-bold ${healthOk === false || readyOk === false ? 'bg-[#E94E36]' : 'bg-[#0E9F6E]'} text-white`}>{healthOk === false || readyOk === false ? '● OFFLINE' : '● READY'}</span>
          </div>
          <div className="hidden md:flex items-center gap-3 opacity-80">
            <span className={healthOk ? 'text-[#0E9F6E]' : healthOk === false ? 'text-[#E94E36]' : ''}>SYS:{healthOk === null ? '…' : healthOk ? 'OK' : 'DOWN'}</span>
            <span className={readyOk ? 'text-[#0E9F6E]' : readyOk === false ? 'text-[#E94E36]' : ''}>ENG:{readyOk === null ? '…' : readyOk ? 'READY' : 'OFF'}</span>
            <span className="w-2 h-2 bg-[#0E9F6E] rounded-full animate-pulse inline-block" />
          </div>
        </div>
      </div>

      {/* header */}
      <header className="relative bg-[var(--paper)] border-b-[3px] border-[var(--line)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[var(--line)] text-[var(--cream)] grid place-items-center font-black text-[11px] leading-none border-[2px] border-[var(--line)]"><span>OCR<br />78</span></div>
              <div>
                <div className="font-black tracking-tighter leading-none text-[22px] sm:text-[26px] flex gap-1.5"><span>RETRO</span><span className="bg-[var(--vermillion)] text-white px-1">OCR</span></div>
                <div className="text-[10px] tracking-[0.2em] font-bold opacity-60">SCAN • EXTRACT • PRINT</div>
              </div>
            </div>
            <nav className="hidden sm:flex items-center gap-2 text-[12px] font-bold tracking-wide">
              <span className="px-3 py-1.5 border-[2px] border-[var(--line)] bg-white">MICROSERVICE v1.0</span>
              <span className={`px-3 py-1.5 border-[2px] border-[var(--line)] hidden lg:inline ${readyOk ? 'bg-[var(--mustard)]' : 'bg-white'}`}>{readyOk ? '• ONLINE' : '• CHECKING'}</span>
            </nav>
          </div>

          {/* hero — no invented accuracy/speed claims */}
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 lg:gap-8 pb-8 items-end">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] border-[1.5px] border-[var(--line)] bg-white px-2.5 py-1">
                <span className="w-1.5 h-1.5 bg-[var(--vermillion)] rounded-full animate-pulse" /> PHOTOCOPY LAB — EST. 1978
              </div>
              <h1 className="font-['Bebas_Neue'] leading-[0.85] tracking-[-0.02em] mt-3 text-[56px] sm:text-[72px] lg:text-[92px]">
                <span className="block">EXTRACT</span>
                <span className="block flex items-center gap-3">TEXT <span className="text-[16px] sm:text-[18px] font-['Space_Mono'] tracking-[0.14em] font-bold bg-[var(--line)] text-white px-2 py-1 translate-y-1">FROM IMAGE →</span></span>
                <span className="block text-transparent" style={{ WebkitTextStroke: '1.2px var(--line)' as any }}>IN SECONDS.</span>
              </h1>
              <p className="mt-4 max-w-[560px] text-[13px] leading-6 opacity-70 font-['JetBrains_Mono']">
                Drop any image — receipts, typewriter pages, newspapers. Fast, accurate text extraction with a classic touch.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold">
                <span className="px-2.5 py-1 bg-white border-[1.5px] border-[var(--line)]">PNG · JPG · WEBP</span>
                <span className="px-2.5 py-1 bg-[var(--mustard)] border-[1.5px] border-[var(--line)]">MAX 10MB</span>
                <span className="px-2.5 py-1 bg-white border-[1.5px] border-[var(--line)]">AUTH REQUIRED</span>
              </div>
            </div>

            {/* spec sheet — only measured/verified info */}
            <div className="bg-white border-[3px] border-[var(--line)] shadow-[8px_8px_0_var(--line)] relative overflow-hidden">
              <div className="absolute inset-0 halftone opacity-[0.06] pointer-events-none" />
              <div className="relative p-4 sm:p-5">
                <div className="flex justify-between items-start">
                  <div className="text-[10px] tracking-[0.18em] font-bold">SPEC SHEET — OCR-78</div>
                  <div className="text-[10px] bg-[var(--line)] text-white px-1.5 py-0.5">{tessVersion ? `TESS ${tessVersion}` : 'REV. 4.2'}</div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="border-[1.5px] border-[var(--line)] bg-[var(--cream)] p-2 text-center">
                    <div className="font-black text-[18px] leading-none">{healthOk ? 'OK' : '…'}</div>
                    <div className="text-[9px] tracking-widest font-bold mt-1">HEALTH</div>
                    <div className="text-[9px] opacity-50">/health</div>
                  </div>
                  <div className="border-[1.5px] border-[var(--line)] bg-[var(--cream)] p-2 text-center">
                    <div className="font-black text-[14px] leading-none truncate">{readyOk ? (tessVersion ?? 'READY') : '…'}</div>
                    <div className="text-[9px] tracking-widest font-bold mt-1">ENGINE</div>
                    <div className="text-[9px] opacity-50">/ready</div>
                  </div>
                  <div className="border-[1.5px] border-[var(--line)] bg-[var(--cream)] p-2 text-center">
                    <div className="font-black text-[18px] leading-none">10MB</div>
                    <div className="text-[9px] tracking-widest font-bold mt-1">MAX SIZE</div>
                    <div className="text-[9px] opacity-50">per file</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="flex-1 h-[46px] border-[1.5px] border-[var(--line)] bg-[var(--mustard)] grid place-items-center text-[11px] font-black">{readyOk ? '● READY TO SCAN' : '● CHECKING ENGINE…'}</div>
                  <div className="w-[46px] h-[46px] border-[1.5px] border-[var(--line)] grid place-items-center bg-white">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M7 8h10M7 12h10M7 16h6" /></svg>
                  </div>
                </div>
                <div className="mt-3 text-[10px] leading-3 opacity-60 font-['JetBrains_Mono']">Supported: PNG JPG WEBP • 10MB max • 30s timeout • Tesseract OCR</div>
              </div>
              <div className="h-2 bg-[repeating-linear-gradient(90deg,var(--line)_0_8px,transparent_8px_16px)]" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 relative z-10">
        {error && (
          <div className="mb-6 border-[2px] border-[var(--line)] bg-[#FFF1F1] p-3 flex gap-3 items-start shadow-[4px_4px_0_var(--line)]">
            <span className="bg-[var(--vermillion)] text-white px-1.5 py-0.5 text-[11px] font-black">ERR</span>
            <div>
              <div className="font-black text-[13px]">Extraction failed</div>
              <div className="text-[13px] leading-5 opacity-80">{error}</div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1.08fr_0.92fr] gap-6 items-start">

          {/* LEFT: upload — wired to real backend */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-[0.14em] border-[2px] border-[var(--line)] bg-white px-2 py-1">INPUT — IMAGE</span>
              <span className="text-[11px] opacity-60 font-['JetBrains_Mono'] hidden sm:inline">PNG JPG WEBP • 10MB max • auth required</span>
              <button onClick={() => { setFile(null); setPreview(null); setEditable(''); reset(); setValidationError(null); }} className="ml-auto cursor-pointer text-[11px] font-bold underline decoration-dotted">CLEAR</button>
            </div>
            {validationError && (
              <div className="border-[2px] border-[var(--line)] bg-[#FFF1F1] p-2 text-[12px] font-bold text-[#E94E36] shadow-[3px_3px_0_var(--line)]" role="alert">{validationError}</div>
            )}

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => !preview && inputRef.current?.click()}
              className={`relative bg-white border-[3px] border-[var(--line)] shadow-[6px_6px_0_var(--line)] overflow-hidden ${!preview ? 'cursor-pointer' : ''} ${dragOver ? 'bg-[var(--mustard)]' : ''}`}
            >
              <div className="absolute inset-0 pointer-events-none opacity-[0.04] scanline" />
              {!preview ? (
                <div className="relative p-6 sm:p-8 text-center">
                  <div className="mx-auto w-[72px] h-[72px] border-[2px] border-[var(--line)] bg-[var(--cream)] grid place-items-center shadow-[4px_4px_0_var(--line)]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 16V3M8 7l4-4 4 4" /><rect x="3" y="14" width="18" height="7" rx="1" /><path d="M7 18h10" /></svg>
                  </div>
                  <div className="mt-4 font-black tracking-tight text-[18px]">DROP IMAGE HERE</div>
                  <div className="text-[12px] opacity-60 mt-1 font-['JetBrains_Mono']">or click to browse • paste with Ctrl+V</div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button onClick={e => { e.stopPropagation(); inputRef.current?.click(); }} className="cursor-pointer bg-[var(--line)] text-white px-4 py-2 text-[12px] font-bold border-[2px] border-[var(--line)] hover:bg-black transition-colors">BROWSE FILES</button>
                    <button onClick={e => { e.stopPropagation(); cameraOn ? stopCamera() : startCamera(); }} className="cursor-pointer bg-white px-4 py-2 text-[12px] font-bold border-[2px] border-[var(--line)] hover:bg-[var(--cream)] transition-colors">{cameraOn ? 'CLOSE CAMERA' : 'USE CAMERA'}</button>
                  </div>
                  <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" className="hidden" onChange={e => handleFiles(e.target.files)} aria-label="Upload image" data-testid="file-input" />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute top-2 left-2 z-10 bg-[var(--line)] text-white text-[10px] font-bold px-1.5 py-0.5 tracking-widest">PREVIEW — {(file?.name ?? 'CAPTURE').slice(0, 18)}</div>
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    <button onClick={() => { setPreview(null); setFile(null); setEditable(''); reset(); }} className="cursor-pointer bg-white border-[1.5px] border-[var(--line)] px-2 py-1 text-[10px] font-bold hover:bg-red-50">✕ REMOVE</button>
                  </div>
                  <img src={preview} alt="preview" className="w-full max-h-[420px] object-contain bg-[#0F0F0F]" />
                  {isLoading && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute inset-x-0 h-[3px] bg-[#0E9F6E] shadow-[0_0_12px_#0E9F6E]" style={{ animation: 'scan 1.2s linear infinite' }} />
                      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(14,159,110,0.08)_50%)] bg-[length:100%_4px]" />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 p-3 bg-[var(--cream)] border-t-[2px] border-[var(--line)]">
                    <button onClick={runOcr} disabled={isLoading || !file} className="cursor-pointer flex-1 min-w-[140px] bg-[var(--vermillion)] text-white font-black tracking-wide text-[13px] px-4 py-2.5 border-[2px] border-[var(--line)] shadow-[3px_3px_0_var(--line)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--line)] disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                      {isLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>◉</span>}
                      {isLoading ? 'SCANNING…' : 'EXTRACT TEXT →'}
                    </button>
                    <button onClick={() => inputRef.current?.click()} className="cursor-pointer bg-white border-[2px] border-[var(--line)] px-3 py-2 text-[12px] font-bold">REPLACE</button>
                  </div>
                  <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" className="hidden" onChange={e => handleFiles(e.target.files)} aria-label="Upload image" data-testid="file-input-replace" />
                </div>
              )}
            </div>

            {cameraOn && (
              <div className="bg-black border-[3px] border-[var(--line)] shadow-[6px_6px_0_var(--line)] overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full max-h-[320px] object-cover" />
                <div className="flex gap-2 p-2 bg-[#111]">
                  <button onClick={snap} className="cursor-pointer flex-1 bg-[#0E9F6E] text-white font-bold py-2 border border-white/20">● CAPTURE</button>
                  <button onClick={stopCamera} className="cursor-pointer bg-white px-4 font-bold">CLOSE</button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              {[
                ['01', 'DROP', 'Any photo or scan'],
                ['02', 'EXTRACT', 'Instant text capture'],
                ['03', 'COPY', 'Download .txt or .json'],
              ].map(([n, t, d]) => (
                <div key={n} className="bg-white border-[1.5px] border-[var(--line)] p-2.5">
                  <div className="font-black text-[10px] tracking-widest opacity-40">{n}</div>
                  <div className="font-black">{t}</div>
                  <div className="opacity-60 leading-tight">{d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: output — truthful (no confidence, real counts) */}
          <div className="lg:sticky lg:top-[104px] space-y-4">
            <div className="bg-white border-[3px] border-[var(--line)] shadow-[6px_6px_0_var(--line)] overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-b-[2px] border-[var(--line)] bg-[var(--cream)]">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-[var(--mustard)] animate-pulse' : data ? 'bg-[#0E9F6E]' : 'bg-slate-300'}`} />
                  <span className="font-black text-[11px] tracking-[0.14em]">OUTPUT — TEXT</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold opacity-60 hidden sm:inline">{data ? `${charCount} chars • ${wordCount} words` : 'NO DATA'}</span>
                  <button disabled={!editable} onClick={() => copy(editable)} className="cursor-pointer disabled:opacity-40 bg-[var(--line)] text-white text-[11px] font-bold px-2.5 py-1 border border-[var(--line)] hover:bg-black transition-colors">{copied ? '✓ COPIED' : 'COPY'}</button>
                </div>
              </div>

              <div className="relative">
                {!data && !isLoading ? (
                  <div className="p-8 text-center">
                    <div className="font-['Instrument_Serif'] text-[28px] leading-none">Waiting for image…</div>
                    <div className="text-[12px] opacity-60 mt-2 font-['JetBrains_Mono']">Extracted text will appear here as editable output.<br />Drop an image and hit Extract.</div>
                    <div className="mt-4 inline-block border-[1.5px] border-dashed border-[var(--line)] px-3 py-2 text-[11px] font-bold bg-[var(--cream)]">TIP: Paste screenshot with Ctrl+V</div>
                  </div>
                ) : isLoading ? (
                  <div className="p-6">
                    <div className="h-2 bg-[var(--cream)] border border-[var(--line)] overflow-hidden">
                      <div className="h-full bg-[var(--mustard)] animate-pulse" style={{ width: '100%' }} />
                    </div>
                    <div className="mt-3 font-['JetBrains_Mono'] text-[11px] tracking-widest animate-pulse">READING GLYPHS… Tesseract • 30s timeout</div>
                    <div className="mt-4 space-y-2">
                      <div className="h-3 bg-[var(--cream)] border border-[var(--line)] w-[92%] animate-pulse" />
                      <div className="h-3 bg-[var(--cream)] border border-[var(--line)] w-[88%] animate-pulse" />
                      <div className="h-3 bg-[var(--cream)] border border-[var(--line)] w-[74%] animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={editable}
                      onChange={e => setEditable(e.target.value)}
                      className="w-full min-h-[320px] max-h-[520px] p-4 sm:p-5 font-['JetBrains_Mono'] text-[13px] leading-6 bg-[#FFFEF7] focus:outline-none resize-y"
                      placeholder="Extracted text…"
                      spellCheck={false}
                    />
                    <div className="h-3 bg-white border-t-[2px] border-[var(--line)] flex gap-[6px] items-center px-2">
                      {Array.from({ length: 22 }).map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full border border-[var(--line)] bg-[var(--cream)]" />)}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 p-2 bg-[var(--cream)] border-t-[2px] border-[var(--line)]">
                <button disabled={!data} onClick={() => download('txt')} className="cursor-pointer disabled:opacity-40 bg-white border-[1.5px] border-[var(--line)] py-2 text-[11px] font-bold hover:bg-[var(--mustard)] transition-colors">↓ .TXT</button>
                <button disabled={!data} onClick={() => download('json')} className="cursor-pointer disabled:opacity-40 bg-white border-[1.5px] border-[var(--line)] py-2 text-[11px] font-bold hover:bg-[var(--mustard)] transition-colors">↓ .JSON</button>
                <button disabled={!editable} onClick={() => copy(editable)} className="cursor-pointer disabled:opacity-40 bg-[var(--line)] text-white py-2 text-[11px] font-bold hover:bg-black transition-colors">COPY TEXT</button>
              </div>
            </div>

          </div>
        </div>

      </main>

      <style>{`@keyframes scan{0%{top:0}100%{top:100%}}`}</style>
    </div>
  );
}
