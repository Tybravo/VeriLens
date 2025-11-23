'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function RouteProgressBarContent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const finishTimeoutRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const start = () => {
      startedRef.current = true;
      setVisible(true);
      setProgress(0);
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setProgress((p) => (p < 80 ? p + 3 : p));
      }, 80);
    };

    const onAnchorClick = (e: Event) => {
      const t = e.target as HTMLElement;
      const a = t.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      try {
        const url = new URL(href, window.location.origin);
        const samePath = url.pathname === pathname;
        const onlyHashChange = samePath && url.hash !== window.location.hash && url.search === window.location.search;
        if (onlyHashChange) return;
        if (url.origin === window.location.origin && href.startsWith('/')) start();
      } catch {
        if (href.startsWith('/')) start();
      }
    };

    const onPopState = () => start();
    const onHashChange = () => start();
    const onLoad = () => {
      if (startedRef.current) {
        setProgress(100);
        window.setTimeout(() => {
          setVisible(false);
          setProgress(0);
          startedRef.current = false;
        }, 250);
      }
    };

    document.addEventListener('click', onAnchorClick, true);
    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('load', onLoad);
    return () => {
      document.removeEventListener('click', onAnchorClick, true);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('load', onLoad);
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (finishTimeoutRef.current) window.clearTimeout(finishTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!startedRef.current) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    setProgress(100);
    const doneTimer = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
      startedRef.current = false;
      window.clearTimeout(doneTimer);
    }, 250);
  }, [pathname, searchParams?.toString()]);

  useEffect(() => {
    if (startedRef.current && !finishTimeoutRef.current) {
      finishTimeoutRef.current = window.setTimeout(() => {
        setProgress(100);
        window.setTimeout(() => {
          setVisible(false);
          setProgress(0);
          startedRef.current = false;
        }, 250);
        if (finishTimeoutRef.current) window.clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }, 5000);
    }
  }, [visible]);

  return (
    <div className="w-full">
      <div className="h-[3px] bg-green-500 transition-all duration-150" style={{ width: visible ? `${progress}%` : '0%' }} />
    </div>
  );
}

export default function RouteProgressBar() {
  return (
    <Suspense fallback={<div className="w-full h-[3px]" />}>
      <RouteProgressBarContent />
    </Suspense>
  );
}