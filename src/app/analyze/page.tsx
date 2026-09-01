"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

import { SiteHeader } from "@/components/site-header";

type AnalyzeMode = "text" | "audio";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export default function AnalyzePage() {
  const [mode, setMode] = useState<AnalyzeMode>("text");
  const [transcript, setTranscript] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function changeMode(nextMode: AnalyzeMode) {
    if (isAnalyzing) return;
    setMode(nextMode);
    setStatusMessage("");
    setErrorMessage("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setStatusMessage("");

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

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setAudioFile(null);
      setErrorMessage("This file is over the 25 MB upload limit.");
      event.target.value = "";
      return;
    }

    setAudioFile(file);
    setErrorMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (mode === "text" && transcript.trim().length < 20) {
      setErrorMessage("Add at least a few lines of conversation before analyzing.");
      return;
    }

    if (mode === "audio" && !audioFile) {
      setErrorMessage("Choose an audio recording before analyzing.");
      return;
    }

    setIsAnalyzing(true);
    timerRef.current = setTimeout(() => {
      setIsAnalyzing(false);
      setStatusMessage(
        mode === "text"
          ? "Conversation accepted. AI analysis will be connected in Milestone 3."
          : "Audio accepted. Secure transcription will be connected in Milestone 2.",
      );
    }, 2200);
  }

  const canSubmit = mode === "text" ? transcript.trim().length >= 20 : Boolean(audioFile);

  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <SiteHeader showAnalyzeAction={false} />

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[0.75fr_1.25fr] lg:px-10 lg:py-18">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950">
            <span aria-hidden="true">←</span> Back to home
          </Link>
          <p className="mt-12 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Private analysis</p>
          <h1 className="font-display mt-4 max-w-lg text-5xl font-black leading-[0.92] tracking-[-0.06em] text-slate-950 sm:text-6xl">
            What does the conversation reveal?
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-slate-600">
            Add the conversation in the format you already have. We focus on repeatable behavior signals—not personality labels.
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
                <p className="font-extrabold text-slate-950">Your conversation stays private</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Audio will be deleted immediately after transcription once that feature is connected.</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.09)] sm:p-8 lg:p-10">
          <div className="flex rounded-2xl bg-slate-100 p-1.5" role="tablist" aria-label="Conversation input type">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "text"}
              onClick={() => changeMode("text")}
              className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition focus-visible:outline-2 focus-visible:outline-slate-950 ${
                mode === "text" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
                <path d="M4 4.5h12v9H9l-3.5 3v-3H4v-9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M7 8h6M7 10.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="sm:hidden">Paste text</span>
              <span className="hidden sm:inline">Paste a conversation</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "audio"}
              onClick={() => changeMode("audio")}
              className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition focus-visible:outline-2 focus-visible:outline-slate-950 ${
                mode === "audio" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
                <rect x="7" y="2.5" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5M7.5 17.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Upload audio
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8">
            {mode === "text" ? (
              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <label htmlFor="transcript" className="text-lg font-extrabold text-slate-950">Conversation transcript</label>
                    <p className="mt-1 text-sm text-slate-500">Speaker names help, but any readable format works.</p>
                  </div>
                  <span className="hidden text-xs font-bold text-slate-400 sm:block">{transcript.length.toLocaleString()} characters</span>
                </div>
                <textarea
                  id="transcript"
                  value={transcript}
                  disabled={isAnalyzing}
                  onChange={(event) => {
                    setTranscript(event.target.value);
                    setErrorMessage("");
                    setStatusMessage("");
                  }}
                  rows={15}
                  className="mt-4 w-full resize-y rounded-2xl border border-slate-300 bg-[#fbfbf8] p-5 text-[15px] leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-lime-300/25 disabled:cursor-wait disabled:opacity-60"
                  placeholder={"Alex: I had a great time last night.\nJordan: Me too. Want to meet again this weekend?\nAlex: Saturday works for me..."}
                />
              </div>
            ) : (
              <div>
                <div>
                  <p className="text-lg font-extrabold text-slate-950">Audio recording</p>
                  <p className="mt-1 text-sm text-slate-500">Up to 10 minutes and 25 MB. Common audio formats are accepted.</p>
                </div>

                <label
                  htmlFor="audio-file"
                  className={`mt-4 flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition focus-within:border-slate-950 focus-within:ring-4 focus-within:ring-lime-300/25 ${
                    audioFile ? "border-lime-400 bg-lime-50/60" : "border-slate-300 bg-[#fbfbf8] hover:border-slate-500"
                  } ${isAnalyzing ? "pointer-events-none opacity-60" : ""}`}
                >
                  <input
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    disabled={isAnalyzing}
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <span className="grid size-16 place-items-center rounded-full bg-slate-950 text-white shadow-lg">
                    <svg viewBox="0 0 24 24" className="size-7" fill="none" aria-hidden="true">
                      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="mt-5 text-base font-extrabold text-slate-950">
                    {audioFile ? audioFile.name : "Choose an audio file"}
                  </span>
                  <span className="mt-2 text-sm text-slate-500">
                    {audioFile ? `${(audioFile.size / 1024 / 1024).toFixed(1)} MB · Click to replace` : "or drag it here from your device"}
                  </span>
                </label>

                <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0" fill="none" aria-hidden="true">
                    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 6.5v4.2M10 13.7v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <p><strong>Consent matters.</strong> Only upload recordings you have the right to use, and make sure everyone recorded gave informed consent.</p>
                </div>
              </div>
            )}

            <div className="mt-6 min-h-7" aria-live="polite">
              {errorMessage && <p className="text-sm font-bold text-red-600">{errorMessage}</p>}
              {statusMessage && <p className="text-sm font-bold text-emerald-700">{statusMessage}</p>}
            </div>

            <button
              type="submit"
              disabled={!canSubmit || isAnalyzing}
              className="mt-2 flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-slate-950 px-6 text-base font-extrabold text-white shadow-[0_12px_26px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {isAnalyzing ? (
                <>
                  Analyzing conversation
                  <span className="flex items-center gap-1" aria-hidden="true">
                    <span className="loading-dot size-1.5 rounded-full bg-lime-300" />
                    <span className="loading-dot size-1.5 rounded-full bg-lime-300" />
                    <span className="loading-dot size-1.5 rounded-full bg-lime-300" />
                  </span>
                </>
              ) : (
                <>Run private analysis <span aria-hidden="true">→</span></>
              )}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-400">
              DateRadar reports observable behavior signals, not diagnoses. Use the result as one input—not a final verdict.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
