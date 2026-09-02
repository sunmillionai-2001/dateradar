"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { isStoredAnalysis, type AnalysisProviderName, type StoredAnalysis } from "@/lib/analysis-report";
import { normalizeTranscript } from "@/lib/transcript";

type AnalyzeMode = "text" | "screenshots" | "audio";
type TesseractWorker = { terminate: () => Promise<unknown> };

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MAX_AUDIO_SECONDS = 10 * 60;
const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;
const MAX_SCREENSHOTS = 8;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/bmp", "image/tiff"]);

function getAudioDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    const audio = document.createElement("audio");
    const objectUrl = URL.createObjectURL(file);
    let settled = false;
    const timeout = window.setTimeout(() => finish(null), 5000);

    function finish(duration: number | null) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    }

    audio.preload = "metadata";
    audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) ? audio.duration : null);
    audio.onerror = () => finish(null);
    audio.src = objectUrl;
  });
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "Duration unavailable";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [mode, setMode] = useState<AnalyzeMode>("text");
  const [transcript, setTranscript] = useState("");
  const [draftSource, setDraftSource] = useState<AnalyzeMode | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [workLabel, setWorkLabel] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const ocrWorkerRef = useRef<TesseractWorker | null>(null);
  const ocrAbortRef = useRef<AbortController | null>(null);
  const audioAbortRef = useRef<AbortController | null>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      audioAbortRef.current?.abort();
      ocrAbortRef.current?.abort();
      analysisAbortRef.current?.abort();
      const worker = ocrWorkerRef.current;
      ocrWorkerRef.current = null;
      if (worker) void worker.terminate();
    };
  }, []);

  function resetMessages() {
    setStatusMessage("");
    setErrorMessage("");
  }

  function changeMode(nextMode: AnalyzeMode) {
    if (isWorking) return;
    setMode(nextMode);
    resetMessages();
  }

  function handleScreenshotChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    resetMessages();
    setDraftSource(null);

    if (files.length > MAX_SCREENSHOTS) {
      setScreenshotFiles([]);
      setErrorMessage(`Choose no more than ${MAX_SCREENSHOTS} screenshots at once.`);
      event.target.value = "";
      return;
    }

    const invalidFile = files.find((file) => !IMAGE_TYPES.has(file.type) || file.size > MAX_SCREENSHOT_BYTES);
    if (invalidFile) {
      setScreenshotFiles([]);
      setErrorMessage("Each screenshot must be PNG, JPG, WebP, BMP, or TIFF and no larger than 10 MB.");
      event.target.value = "";
      return;
    }

    setScreenshotFiles(files);
  }

  async function handleAudioChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    resetMessages();
    setDraftSource(null);
    setAudioDuration(null);

    if (!file) {
      setAudioFile(null);
      return;
    }

    if (!file.type.startsWith("audio/")) {
      setAudioFile(null);
      setErrorMessage("Please choose an audio file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AUDIO_BYTES) {
      setAudioFile(null);
      setErrorMessage("This file is over the 25 MB upload limit.");
      event.target.value = "";
      return;
    }

    const duration = await getAudioDuration(file);
    if (duration !== null && duration > MAX_AUDIO_SECONDS) {
      setAudioFile(null);
      setErrorMessage("This recording is longer than the 10-minute limit.");
      event.target.value = "";
      return;
    }

    setAudioFile(file);
    setAudioDuration(duration);
  }

  function clearScreenshots() {
    setScreenshotFiles([]);
    if (screenshotInputRef.current) screenshotInputRef.current.value = "";
  }

  function clearAudio() {
    setAudioFile(null);
    setAudioDuration(null);
    if (audioInputRef.current) audioInputRef.current.value = "";
  }

  async function extractWithLocalOcr(files: File[]) {
    setWorkLabel("Using local OCR fallback");
    setStatusMessage("using local OCR fallback");
    const { createWorker } = await import("tesseract.js");
    let completedFiles = 0;
    const worker = await createWorker("eng", undefined, {
      logger: (message) => {
        if (message.status === "recognizing text") {
          const progress = (completedFiles + message.progress) / files.length;
          setOcrProgress(Math.min(99, Math.round(progress * 100)));
        }
      },
    });
    ocrWorkerRef.current = worker;

    const parts: string[] = [];
    for (const file of files) {
      const result = await worker.recognize(file);
      const text = normalizeTranscript(result.data.text);
      if (text) parts.push(text);
      completedFiles += 1;
      setOcrProgress(Math.round((completedFiles / files.length) * 100));
    }

    return normalizeTranscript(parts.join("\n\n"));
  }

  async function extractWithAliyunOcr(files: File[], signal: AbortSignal) {
    setWorkLabel("Reading screenshots securely");
    const parts: string[] = [];

    for (const [index, file] of files.entries()) {
      const formData = new FormData();
      formData.append("image", file, file.name);
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
        signal,
      });
      const payload = (await response.json()) as { text?: unknown; error?: unknown };

      if (!response.ok || typeof payload.text !== "string") {
        throw new Error(typeof payload.error === "string" ? payload.error : "Alibaba Cloud OCR could not read this screenshot.");
      }

      const text = normalizeTranscript(payload.text);
      if (text) parts.push(text);
      setOcrProgress(Math.round(((index + 1) / files.length) * 100));
    }

    return normalizeTranscript(parts.join("\n\n"));
  }

  async function extractScreenshots() {
    const files = [...screenshotFiles];
    const controller = new AbortController();
    ocrAbortRef.current = controller;
    setIsWorking(true);
    setWorkLabel("Choosing secure OCR provider");
    setOcrProgress(0);

    try {
      const providerResponse = await fetch("/api/ocr", { cache: "no-store", signal: controller.signal });
      const providerPayload = (await providerResponse.json().catch(() => ({}))) as { provider?: unknown };
      const useAliyun = providerResponse.ok && providerPayload.provider === "aliyun";
      const merged = useAliyun
        ? await extractWithAliyunOcr(files, controller.signal)
        : await extractWithLocalOcr(files);

      if (!merged) throw new Error("No readable text was found in these screenshots.");

      setTranscript(merged);
      setDraftSource("screenshots");
      setStatusMessage(
        useAliyun
          ? "Alibaba Cloud OCR complete. The original screenshots were deleted; review the editable draft below."
          : "OCR complete — using local OCR fallback. The original screenshots were cleared; review the editable draft below.",
      );
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setErrorMessage(error.message || "The screenshots could not be read. Try clearer images.");
      }
    } finally {
      const worker = ocrWorkerRef.current;
      ocrWorkerRef.current = null;
      if (worker) await worker.terminate().catch(() => undefined);
      clearScreenshots();
      ocrAbortRef.current = null;
      setOcrProgress(0);
      setIsWorking(false);
      setWorkLabel("");
    }
  }

  async function transcribeAudio() {
    if (!audioFile) return;

    const file = audioFile;
    const controller = new AbortController();
    audioAbortRef.current = controller;
    setIsWorking(true);
    setWorkLabel("Transcribing audio");

    try {
      const formData = new FormData();
      formData.append("audio", file, file.name);
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const payload = (await response.json()) as { transcript?: unknown; mode?: unknown; error?: unknown };

      if (!response.ok || typeof payload.transcript !== "string") {
        throw new Error(typeof payload.error === "string" ? payload.error : "The recording could not be transcribed.");
      }

      setTranscript(normalizeTranscript(payload.transcript));
      setDraftSource("audio");
      setStatusMessage(
        payload.mode === "mock"
          ? "Mock transcription complete because OPENAI_API_KEY is not configured. The original audio was cleared."
          : "Whisper transcription complete. The original audio was cleared; review the editable draft below.",
      );
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setErrorMessage(error.message);
    } finally {
      clearAudio();
      audioAbortRef.current = null;
      setIsWorking(false);
      setWorkLabel("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    if (draftSource === mode || mode === "text") {
      const normalized = normalizeTranscript(transcript);
      if (normalized.length < 20) {
        setErrorMessage("Add at least a few lines of conversation before continuing.");
        return;
      }
      setTranscript(normalized);
      const controller = new AbortController();
      analysisAbortRef.current = controller;
      setIsWorking(true);
      setWorkLabel("Analyzing signals");

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: normalized }),
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null) as unknown;
        if (!response.ok) {
          const error = payload && typeof payload === "object" && "error" in payload
            ? (payload as { error?: unknown }).error
            : null;
          throw new Error(typeof error === "string" ? error : "The conversation could not be analyzed.");
        }

        const providerHeader = response.headers.get("X-DateXray-Analysis-Provider");
        const provider: AnalysisProviderName = ["anthropic", "deepseek", "mock"].includes(providerHeader ?? "")
          ? providerHeader as AnalysisProviderName
          : "mock";
        const stored: StoredAnalysis = { report: payload as StoredAnalysis["report"], provider, createdAt: new Date().toISOString() };
        if (!isStoredAnalysis(stored)) throw new Error("The analysis response was incomplete. Please try again.");

        const reportId = crypto.randomUUID();
        sessionStorage.setItem(`datexray:report:${reportId}`, JSON.stringify(stored));
        router.push(`/report/${reportId}`);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") setErrorMessage(error.message);
      } finally {
        analysisAbortRef.current = null;
        setIsWorking(false);
        setWorkLabel("");
      }
      return;
    }

    if (mode === "screenshots") {
      if (!screenshotFiles.length) {
        setErrorMessage("Choose at least one chat screenshot.");
        return;
      }
      await extractScreenshots();
      return;
    }

    if (!audioFile) {
      setErrorMessage("Choose an audio recording to transcribe.");
      return;
    }
    await transcribeAudio();
  }

  const hasCurrentDraft = draftSource === mode;
  const canSubmit = isWorking
    ? false
    : mode === "text" || hasCurrentDraft
      ? transcript.trim().length >= 20
      : mode === "screenshots"
        ? screenshotFiles.length > 0
        : Boolean(audioFile);
  const submitLabel = hasCurrentDraft || mode === "text"
    ? "Analyze conversation"
    : mode === "screenshots"
      ? "Extract text securely"
      : "Transcribe audio";

  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <SiteHeader showAnalyzeAction={false} />

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[0.75fr_1.25fr] lg:px-10 lg:py-18">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950">
            <span aria-hidden="true">←</span> Back to home
          </Link>
          <p className="mt-12 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Private conversion</p>
          <h1 className="font-display mt-4 max-w-lg text-5xl font-black leading-[0.92] tracking-[-0.06em] text-slate-950 sm:text-6xl">
            Turn any conversation into text.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-slate-600">
            Paste it, read it from chat screenshots, or transcribe a recording. Every route produces one editable transcript.
          </p>

          <div className="mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lime-300 text-slate-950">
                <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
                  <path d="M5.5 8V6.5a4.5 4.5 0 0 1 9 0V8" stroke="currentColor" strokeWidth="1.6" />
                  <rect x="3.5" y="8" width="13" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </span>
              <div>
                <p className="font-extrabold text-slate-950">Source files are temporary</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Screenshots and audio are processed securely and deleted immediately after conversion.</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.09)] sm:p-8 lg:p-10">
          <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1.5" role="tablist" aria-label="Conversation input type">
            <ModeTab active={mode === "text"} disabled={isWorking} onClick={() => changeMode("text")} icon="text" short="Text" long="Paste text" />
            <ModeTab active={mode === "screenshots"} disabled={isWorking} onClick={() => changeMode("screenshots")} icon="screenshots" short="Screens" long="Chat screenshots" />
            <ModeTab active={mode === "audio"} disabled={isWorking} onClick={() => changeMode("audio")} icon="audio" short="Audio" long="Upload audio" />
          </div>

          <form onSubmit={handleSubmit} className="mt-8">
            {mode === "text" && (
              <TranscriptEditor
                id="transcript"
                label="Conversation transcript"
                help="Speaker names help, but any readable format works."
                transcript={transcript}
                disabled={isWorking}
                onChange={(value) => {
                  setTranscript(value);
                  setDraftSource("text");
                  resetMessages();
                }}
              />
            )}

            {mode === "screenshots" && (
              <div>
                <div>
                  <p className="text-lg font-extrabold text-slate-950">Chat screenshots</p>
                  <p className="mt-1 text-sm text-slate-500">Choose up to {MAX_SCREENSHOTS} images. Alibaba Cloud OCR is used when configured.</p>
                </div>

                <label
                  htmlFor="screenshot-files"
                  className={`mt-4 flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition focus-within:border-slate-950 focus-within:ring-4 focus-within:ring-lime-300/25 ${
                    screenshotFiles.length ? "border-lime-400 bg-lime-50/60" : "border-slate-300 bg-[#fbfbf8] hover:border-slate-500"
                  } ${isWorking ? "pointer-events-none opacity-60" : ""}`}
                >
                  <input
                    ref={screenshotInputRef}
                    id="screenshot-files"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff"
                    multiple
                    disabled={isWorking}
                    onChange={handleScreenshotChange}
                    className="sr-only"
                  />
                  <UploadIcon />
                  <span className="mt-5 text-base font-extrabold text-slate-950">
                    {screenshotFiles.length ? `${screenshotFiles.length} screenshot${screenshotFiles.length === 1 ? "" : "s"} selected` : "Choose chat screenshots"}
                  </span>
                  <span className="mt-2 text-sm text-slate-500">PNG, JPG, WebP, BMP, or TIFF · 10 MB each</span>
                </label>

                {screenshotFiles.length > 0 && (
                  <ul className="mt-4 grid gap-2" aria-label="Selected screenshots">
                    {screenshotFiles.map((file, index) => (
                      <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-4 rounded-xl bg-slate-100 px-4 py-3 text-sm">
                        <span className="min-w-0 truncate font-bold text-slate-700">{index + 1}. {file.name}</span>
                        <span className="shrink-0 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                  <PrivacyIcon />
                  <p><strong>Private processing.</strong> Processed securely and deleted immediately (same as audio).</p>
                </div>
              </div>
            )}

            {mode === "audio" && (
              <div>
                <div>
                  <p className="text-lg font-extrabold text-slate-950">Audio recording</p>
                  <p className="mt-1 text-sm text-slate-500">Up to 10 minutes and 25 MB. Common audio formats are accepted.</p>
                </div>

                <label
                  htmlFor="audio-file"
                  className={`mt-4 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition focus-within:border-slate-950 focus-within:ring-4 focus-within:ring-lime-300/25 ${
                    audioFile ? "border-lime-400 bg-lime-50/60" : "border-slate-300 bg-[#fbfbf8] hover:border-slate-500"
                  } ${isWorking ? "pointer-events-none opacity-60" : ""}`}
                >
                  <input ref={audioInputRef} id="audio-file" type="file" accept="audio/*" disabled={isWorking} onChange={handleAudioChange} className="sr-only" />
                  <UploadIcon />
                  <span className="mt-5 text-base font-extrabold text-slate-950">{audioFile ? audioFile.name : "Choose an audio file"}</span>
                  <span className="mt-2 text-sm text-slate-500">
                    {audioFile ? `${(audioFile.size / 1024 / 1024).toFixed(1)} MB · ${formatDuration(audioDuration)} · Click to replace` : "or drag it here from your device"}
                  </span>
                </label>

                <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  <PrivacyIcon />
                  <p><strong>Consent matters.</strong> Only upload recordings you have the right to use. The original file is cleared as soon as transcription finishes.</p>
                </div>
              </div>
            )}

            {mode !== "text" && hasCurrentDraft && (
              <div className="mt-8 border-t border-slate-200 pt-8">
                <TranscriptEditor
                  id="converted-transcript"
                  label="Editable transcript draft"
                  help="Correct recognition mistakes and add speaker names (Alex: ...) before continuing."
                  transcript={transcript}
                  disabled={isWorking}
                  onChange={(value) => {
                    setTranscript(value);
                    resetMessages();
                  }}
                />
              </div>
            )}

            {isWorking && mode === "screenshots" && (
              <div className="mt-5" aria-live="polite">
                <div className="flex justify-between text-xs font-bold text-slate-600"><span>{workLabel}</span><span>{ocrProgress}%</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${ocrProgress}%` }} /></div>
              </div>
            )}

            <div className="mt-6 min-h-7" aria-live="polite">
              {errorMessage && <p className="text-sm font-bold text-red-600">{errorMessage}</p>}
              {statusMessage && <p className="text-sm font-bold text-emerald-700">{statusMessage}</p>}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-2 flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-slate-950 px-6 text-base font-extrabold text-white shadow-[0_12px_26px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {isWorking ? (
                <>{workLabel}<LoadingDots /></>
              ) : (
                <>{submitLabel} <span aria-hidden="true">→</span></>
              )}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-400">
              DateXray checks observable behavior signals and returns a private, screenshot-ready report.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

function ModeTab({ active, disabled, onClick, icon, short, long }: { active: boolean; disabled: boolean; onClick: () => void; icon: AnalyzeMode; short: string; long: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-sm font-extrabold transition focus-visible:outline-2 focus-visible:outline-slate-950 disabled:cursor-wait ${
        active ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {icon === "text" && <svg viewBox="0 0 20 20" className="hidden size-4 sm:block" fill="none" aria-hidden="true"><path d="M4 4.5h12v9H9l-3.5 3v-3H4v-9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M7 8h6M7 10.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
      {icon === "screenshots" && <svg viewBox="0 0 20 20" className="hidden size-4 sm:block" fill="none" aria-hidden="true"><rect x="3" y="3.5" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="7" cy="7.5" r="1.2" fill="currentColor" /><path d="m5 14 3.2-3 2.3 2 2.2-2.3L15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      {icon === "audio" && <svg viewBox="0 0 20 20" className="hidden size-4 sm:block" fill="none" aria-hidden="true"><rect x="7" y="2.5" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5M7.5 17.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
      <span className="sm:hidden">{short}</span><span className="hidden sm:inline">{long}</span>
    </button>
  );
}

function TranscriptEditor({ id, label, help, transcript, disabled, onChange }: { id: string; label: string; help: string; transcript: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div><label htmlFor={id} className="text-lg font-extrabold text-slate-950">{label}</label><p className="mt-1 text-sm text-slate-500">{help}</p></div>
        <span className="hidden text-xs font-bold text-slate-400 sm:block">{transcript.length.toLocaleString()} characters</span>
      </div>
      <textarea
        id={id}
        value={transcript}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        rows={13}
        className="mt-4 w-full resize-y rounded-2xl border border-slate-300 bg-[#fbfbf8] p-5 text-[15px] leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-lime-300/25 disabled:cursor-wait disabled:opacity-60"
        placeholder={"Alex: I had a great time last night.\nJordan: Me too. Want to meet again this weekend?"}
      />
    </div>
  );
}

function UploadIcon() {
  return <span className="grid size-16 place-items-center rounded-full bg-slate-950 text-white shadow-lg"><svg viewBox="0 0 24 24" className="size-7" fill="none" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>;
}

function PrivacyIcon() {
  return <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6.5v4.2M10 13.7v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function LoadingDots() {
  return <span className="flex items-center gap-1" aria-hidden="true"><span className="loading-dot size-1.5 rounded-full bg-lime-300" /><span className="loading-dot size-1.5 rounded-full bg-lime-300" /><span className="loading-dot size-1.5 rounded-full bg-lime-300" /></span>;
}
