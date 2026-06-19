'use client';

import { useEffect, useRef } from 'react';
import { trpc } from '../lib/trpc';

export function getSessionId() {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('anmol_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('anmol_session_id', sessionId);
  }
  return sessionId;
}

export function ActivityTracker() {
  const recordVisit = trpc.tracking.recordVisit.useMutation();
  const hasRecorded = useRef(false);

  useEffect(() => {
    if (hasRecorded.current) return;
    
    const sessionId = getSessionId();
    const userAgent = window.navigator.userAgent;
    
    hasRecorded.current = true;
    recordVisit.mutate({ sessionId, userAgent });
  }, [recordVisit]);

  return null;
}
