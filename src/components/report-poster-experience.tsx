"use client";

import confetti from "canvas-confetti";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";

import { POSTER_HEIGHT, POSTER_WIDTH, PosterCard } from "@/components/poster-card";
import type { StoredAnalysis } from "@/lib/analysis-report";
import { createReadOnlyShareUrl } from "@/lib/shared-report";

import styles from "./report-poster-experience.module.css";

type ReportPosterExperienceProps = {
  reportId: string;
  stored: StoredAnalysis;
  isUnlocked: boolean;
  isShared: boolean;
};

export function ReportPosterExperience({ reportId, stored, isUnlocked, isShared }: ReportPosterExperienceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl] = useState(() => (
    typeof window === "undefined" ? "" : createReadOnlyShareUrl(stored, window.location.origin)
  ));
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "working" | "failed">("idle");
  const posterRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const celebratedRef = useRef(false);
  const posterSeenKey = useMemo(() => `datexray:poster-seen:${reportId}`, [reportId]);

  useEffect(() => {
    if (!shareUrl) return;
    let active = true;
    QRCode.toDataURL(shareUrl, {
      errorCorrectionLevel: "L",
      margin: 2,
      width: 512,
      color: { dark: "#0f172a", light: "#f8fafc" },
    }).then((dataUrl) => {
      if (active) {
        setQrCodeDataUrl(dataUrl);
        setQrError(false);
      }
    }).catch(() => {
      if (active) {
        setQrCodeDataUrl(null);
        setQrError(true);
      }
    });
    return () => { active = false; };
  }, [shareUrl]);

  useEffect(() => {
    if (!isUnlocked || isShared) return;
    try {
      if (sessionStorage.getItem(posterSeenKey)) return;
    } catch {
      // The report can still open when browser storage is unavailable.
    }
    const frame = window.requestAnimationFrame(() => {
      try {
        sessionStorage.setItem(posterSeenKey, "shown");
      } catch {
        // Opening the report does not depend on browser storage.
      }
      setIsOpen(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isShared, isUnlocked, posterSeenKey]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let secondBurst: ReturnType<typeof setTimeout> | undefined;
    if (!reduceMotion && !celebratedRef.current) {
      celebratedRef.current = true;
      confetti({ particleCount: 100, spread: 78, startVelocity: 42, origin: { x: 0.5, y: 0.18 }, disableForReducedMotion: true });
      secondBurst = setTimeout(() => {
        confetti({ particleCount: 55, spread: 105, startVelocity: 28, origin: { x: 0.5, y: 0.28 }, disableForReducedMotion: true });
      }, 180);
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (secondBurst) clearTimeout(secondBurst);
    };
  }, [isOpen]);

  if (!isUnlocked || isShared) return null;

  async function downloadPoster() {
    if (!posterRef.current || !qrCodeDataUrl) return;
    setDownloadState("working");
    try {
      await document.fonts.ready;
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        backgroundColor: "#0f172a",
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        pixelRatio: 3,
        skipAutoScale: true,
      });
      const link = document.createElement("a");
      link.download = `datexray-${stored.report.risk_level}-risk-report.png`;
      link.href = dataUrl;
      document.body.append(link);
      link.click();
      link.remove();
      setDownloadState("idle");
    } catch {
      setDownloadState("failed");
    }
  }

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={styles.openButton}>
        View image report
      </button>

      {isOpen && (
        <div className={styles.backdrop} role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setIsOpen(false);
        }}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="poster-dialog-title">
            <header className={styles.dialogHeader}>
              <div>
                <p>Full report unlocked</p>
                <h2 id="poster-dialog-title">Your shareable image is ready</h2>
              </div>
              <button ref={closeButtonRef} type="button" onClick={() => setIsOpen(false)} className={styles.closeButton} aria-label="Close image report">×</button>
            </header>

            <div className={styles.previewViewport}>
              <div className={styles.previewCanvas}>
                <PosterCard report={stored.report} qrCodeDataUrl={qrCodeDataUrl} posterRef={posterRef} />
              </div>
            </div>

            <footer className={styles.actions}>
              <p aria-live="polite">
                {qrError ? "The report link is too large for a QR code. Try analyzing a shorter excerpt." : downloadState === "failed" ? "PNG export failed. Please try again." : "Download the PNG or share it with someone you trust."}
              </p>
              <div>
                <button type="button" onClick={() => setIsOpen(false)} className={styles.secondaryButton}>Close</button>
                <button type="button" onClick={downloadPoster} disabled={!qrCodeDataUrl || downloadState === "working"} className={styles.downloadButton}>
                  {downloadState === "working" ? "Creating PNG…" : "Download PNG"}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
