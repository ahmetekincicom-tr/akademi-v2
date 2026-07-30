"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function TopLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const start = () => {
      if (tickRef.current) return;
      if (hideRef.current) clearTimeout(hideRef.current);
      setVisible(true);
      setProgress(8);
      tickRef.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? p : Math.min(90, p + Math.random() * 10)));
      }, 200);
      if (safetyRef.current) clearTimeout(safetyRef.current);
      safetyRef.current = setTimeout(finish, 5000);
    };

    function finish() {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      if (safetyRef.current) {
        clearTimeout(safetyRef.current);
        safetyRef.current = null;
      }
      setProgress(100);
      hideRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }

    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);

    window.history.pushState = ((...args: Parameters<typeof origPush>) => {
      window.dispatchEvent(new Event("aea-nav-start"));
      return origPush(...args);
    }) as typeof window.history.pushState;

    window.history.replaceState = ((...args: Parameters<typeof origReplace>) => {
      window.dispatchEvent(new Event("aea-nav-start"));
      return origReplace(...args);
    }) as typeof window.history.replaceState;

    window.addEventListener("aea-nav-start", start);
    window.addEventListener("popstate", start);

    return () => {
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      window.removeEventListener("aea-nav-start", start);
      window.removeEventListener("popstate", start);
      if (tickRef.current) clearInterval(tickRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
      if (safetyRef.current) clearTimeout(safetyRef.current);
    };
  }, []);

  // pathname actually committed -> navigation is done
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    if (safetyRef.current) clearTimeout(safetyRef.current);
    safetyRef.current = null;

    const completeId = setTimeout(() => {
      setProgress((p) => (p > 0 ? 100 : p));
      hideRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }, 0);

    return () => {
      clearTimeout(completeId);
      if (hideRef.current) clearTimeout(hideRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] bg-transparent">
      <div
        className="h-full bg-brand shadow-[0_0_8px_rgba(28,86,243,0.6)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 200ms ease, opacity 200ms ease 150ms" : "width 250ms ease",
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
