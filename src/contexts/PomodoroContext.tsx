"use client";
import type { PomodoroSessionState } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { ApiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/client';
import BreakOptionsDialog from '@/components/BreakOptionsDialog';

const DEFAULT_POMODORO_MINUTES = 25;
const DEFAULT_REST_MINUTES = 5;

const POMODORO_COMPLETE_SOUND = '/sounds/pomodoro_complete.mp3';
const BREAK_COMPLETE_SOUND = '/sounds/break_complete.mp3';

interface PomodoroContextType {
  sessionState: PomodoroSessionState | null;
  timeLeftSeconds: number;
  isLoading: boolean;
  startPomodoro: (durationMinutes: number, taskTitle?: string) => Promise<void>;
  pausePomodoro: () => Promise<void>;
  continuePomodoro: () => Promise<void>;
  giveUpPomodoro: () => Promise<void>;
  updateUserPreferredDuration: (minutes: number) => Promise<void>;
  updateUserPreferredRestDuration: (minutes: number) => Promise<void>;
  updateNotes: (text: string) => Promise<void>;
  updateCurrentTaskTitle: (taskTitle: string | null) => Promise<void>;
  isResting: boolean;
  restTimeLeftSeconds: number;
  skipRest: () => void;
  isBreakDialogOpen: boolean;
  setIsBreakDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleStartRestPeriod: (selectedOptionId: string) => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

const playSound = (soundUrl: string) => {
  if (typeof window !== 'undefined') {
    try {
      const audio = new Audio(soundUrl);
      audio.play().catch(error => console.warn(`Error playing sound ${soundUrl}:`, error));
    } catch (error) {
      console.warn(`Could not create audio element for ${soundUrl}:`, error);
    }
  }
};

export const PomodoroProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const { toast } = useToast();
  const t = useI18n();

  const apiClient = useMemo(() => new ApiClient(getIdToken), [getIdToken]);

  const [sessionState, setSessionState] = useState<PomodoroSessionState | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(DEFAULT_POMODORO_MINUTES * 60);
  const [isLoading, setIsLoading] = useState(true);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeftSeconds, setRestTimeLeftSeconds] = useState(DEFAULT_REST_MINUTES * 60);

  const pomodoroIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [originalTitle, setOriginalTitle] = useState('');
  const [originalFaviconHref, setOriginalFaviconHref] = useState<string | null>(null);

  const [isBreakDialogOpen, setIsBreakDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginalTitle(document.title);
      const faviconElement = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (faviconElement) {
        setOriginalFaviconHref(faviconElement.href);
      }
    }
  }, []);

  // Fetch and Poll Pomodoro Session State from Backend
  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user?.uid) {
      setSessionState(null);
      setTimeLeftSeconds(DEFAULT_POMODORO_MINUTES * 60);
      setIsLoading(false);
      if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
      setIsResting(false);
      setIsBreakDialogOpen(false);
      return;
    }

    setIsLoading(true);

    const fetchState = async () => {
      try {
        const state = await apiClient.getPomodoro();
        if (state) {
          setSessionState(state);
          setIsResting(!!state.restTargetEndTime && state.restTargetEndTime > Date.now());
        }
      } catch (error) {
        console.error("Error fetching Pomodoro session state from API:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchState();
    // Poll every 5 seconds
    const interval = setInterval(fetchState, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [user, authLoading, apiClient]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const updateFaviconWithTime = useCallback((minutes: number | null, useRestStyling: boolean, isPomodoroIdle: boolean) => {
    if (typeof window === 'undefined') return;
    const faviconSize = 32;
    const canvas = document.createElement('canvas');
    canvas.width = faviconSize;
    canvas.height = faviconSize;
    const context = canvas.getContext('2d');

    if (!context) return;
    context.clearRect(0, 0, faviconSize, faviconSize);

    if (minutes === null || (isPomodoroIdle && !useRestStyling)) {
      if (originalFaviconHref) {
        const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = originalFaviconHref;
        if (!link.parentNode) document.getElementsByTagName('head')[0].appendChild(link);
      }
      return;
    }

    context.beginPath();
    context.arc(faviconSize / 2, faviconSize / 2, faviconSize / 2, 0, 2 * Math.PI);
    context.fillStyle = useRestStyling
      ? (getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#F48FB1')
      : (getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#7E57C2');
    context.fill();

    context.font = `bold ${faviconSize * (String(minutes).length > 1 ? 0.5 : 0.6)}px Arial`;
    context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-foreground').trim() || '#FFFFFF';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(minutes), faviconSize / 2, faviconSize / 2 + faviconSize * 0.05);

    const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = canvas.toDataURL('image/png');
    if (!link.parentNode) {
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [originalFaviconHref]);

  const currentTimerEnds = useCallback(async () => {
    if (!user?.uid || isResting || isBreakDialogOpen) return;

    if (pomodoroIntervalRef.current) {
      clearInterval(pomodoroIntervalRef.current);
      pomodoroIntervalRef.current = null;
    }

    playSound(POMODORO_COMPLETE_SOUND);

    try {
      const updated = await apiClient.updatePomodoro({
        status: 'idle',
        targetEndTime: null,
        pausedTimeLeftSeconds: null,
        currentTaskTitle: null,
      });
      if (updated) {
        setSessionState(updated);
      }
    } catch (e) {
      console.error("Error setting Pomodoro to idle:", e);
    } finally {
      setIsBreakDialogOpen(true);
      if (typeof window !== 'undefined' && Notification.permission === "granted") {
        new Notification(t('pomodoro.notification.title'), {
          body: t('pomodoro.notification.body'),
          icon: '/favicon.ico',
        });
      }
    }
  }, [user?.uid, isResting, isBreakDialogOpen, apiClient, t]);

  useEffect(() => {
    if (!user?.uid || !sessionState || isResting || isBreakDialogOpen || sessionState.status !== 'running' || !sessionState.targetEndTime) {
      if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
      if (sessionState?.status === 'paused' && sessionState.pausedTimeLeftSeconds !== null) {
        setTimeLeftSeconds(sessionState.pausedTimeLeftSeconds);
      } else if (sessionState?.status === 'idle') {
        setTimeLeftSeconds((sessionState.userPreferredDurationMinutes || DEFAULT_POMODORO_MINUTES) * 60);
      }
      return;
    }

    const updateTimer = () => {
      const currentTargetEndTime = sessionState.targetEndTime;
      if (!currentTargetEndTime) {
        if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
        return;
      }
      const now = Date.now();
      const remaining = Math.max(0, Math.round((currentTargetEndTime - now) / 1000));
      setTimeLeftSeconds(remaining);
      if (remaining === 0) {
        currentTimerEnds();
      }
    };

    if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
    updateTimer();
    pomodoroIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
    };
  }, [user?.uid, sessionState, isResting, isBreakDialogOpen, currentTimerEnds]);

  const restTimerEnds = useCallback(async () => {
    if (!user?.uid) return;

    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }

    playSound(BREAK_COMPLETE_SOUND);
    if (typeof window !== 'undefined' && Notification.permission === "granted") {
      new Notification(t('pomodoro.rest.notification.title'), {
        body: t('pomodoro.rest.notification.body'),
        icon: '/favicon.ico',
      });
    }

    try {
      const updated = await apiClient.updatePomodoro({ restTargetEndTime: null });
      if (updated) {
        setSessionState(updated);
      }
      setIsResting(false);
    } catch (error) {
      console.error("Error clearing rest target end time:", error);
    }
  }, [apiClient, t, user?.uid]);

  useEffect(() => {
    if (!isResting || !sessionState?.restTargetEndTime) {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
      return;
    }

    const updateRestTimer = () => {
      const remaining = Math.max(0, Math.round((sessionState.restTargetEndTime! - Date.now()) / 1000));
      setRestTimeLeftSeconds(remaining);
      if (remaining === 0) {
        restTimerEnds();
      }
    };

    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    updateRestTimer();
    restIntervalRef.current = setInterval(updateRestTimer, 1000);

    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [isResting, sessionState?.restTargetEndTime, restTimerEnds]);

  useEffect(() => {
    if (typeof window === 'undefined' || !sessionState) return;

    let currentDisplayTime = 0;
    let titlePrefix = '';
    let displayMinutesForFavicon: number | null = null;
    let useRestStylingForFavicon = false;
    let isPomodoroIdleVisual = sessionState.status === 'idle' && !isResting;
    let taskTitleSegment = sessionState.currentTaskTitle ? `(${sessionState.currentTaskTitle}) ` : '';

    if (isResting) {
      currentDisplayTime = restTimeLeftSeconds;
      titlePrefix = `🧘 ${t('pomodoro.rest.titlePrefix')} `;
      displayMinutesForFavicon = Math.max(0, Math.floor(currentDisplayTime / 60));
      useRestStylingForFavicon = true;
      isPomodoroIdleVisual = false;
    } else {
      currentDisplayTime = timeLeftSeconds;
      if (sessionState.status === 'running') {
        titlePrefix = '⏲️ ';
        displayMinutesForFavicon = Math.max(0, Math.floor(currentDisplayTime / 60));
      } else if (sessionState.status === 'paused') {
        titlePrefix = '⏸️ ';
        displayMinutesForFavicon = Math.max(0, Math.floor(currentDisplayTime / 60));
      }
    }

    if (titlePrefix) {
      document.title = `${titlePrefix}${taskTitleSegment}${formatTime(currentDisplayTime)} - ${originalTitle}`;
    } else {
      document.title = originalTitle;
    }
    updateFaviconWithTime(displayMinutesForFavicon, useRestStylingForFavicon, isPomodoroIdleVisual);
  }, [timeLeftSeconds, restTimeLeftSeconds, isResting, sessionState, originalTitle, updateFaviconWithTime, t]);

  const startPomodoro = async (durationMinutes: number, taskTitle?: string) => {
    if (!user?.uid) return;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === "default") {
        try {
          const permissionResult = await Notification.requestPermission();
          if (permissionResult === "granted") {
            toast({ title: t('notifications.enabled.title'), description: t('notifications.enabled.description') });
          } else if (permissionResult === "denied") {
            toast({ title: t('notifications.denied.title'), description: t('notifications.denied.description'), variant: "destructive" });
          }
        } catch (error) {
          console.error("Error requesting notification permission:", error);
          toast({ title: t('notifications.error.title'), description: t('notifications.error.description'), variant: "destructive" });
        }
      }
    }

    const now = Date.now();
    const targetEndTime = now + durationMinutes * 60 * 1000;
    try {
      const updated = await apiClient.updatePomodoro({
        status: 'running',
        targetEndTime,
        currentSessionInitialDurationMinutes: durationMinutes,
        pausedTimeLeftSeconds: null,
        currentTaskTitle: taskTitle || null,
      });
      if (updated) {
        setSessionState(updated);
      }
    } catch (e) {
      console.error("Error starting pomodoro:", e);
    }
  };

  const pausePomodoro = async () => {
    if (!sessionState || sessionState.status !== 'running' || !sessionState.targetEndTime || !user?.uid) return;

    if (pomodoroIntervalRef.current) {
      clearInterval(pomodoroIntervalRef.current);
    }

    const now = Date.now();
    const pausedTimeLeft = Math.max(0, Math.round((sessionState.targetEndTime - now) / 1000));
    try {
      const updated = await apiClient.updatePomodoro({
        status: 'paused',
        pausedTimeLeftSeconds: pausedTimeLeft,
      });
      if (updated) {
        setSessionState(updated);
      }
    } catch (e) {
      console.error("Error pausing pomodoro:", e);
    }
  };

  const continuePomodoro = async () => {
    if (!sessionState || sessionState.status !== 'paused' || sessionState.pausedTimeLeftSeconds === null || !user?.uid) return;

    const now = Date.now();
    const newTargetEndTime = now + sessionState.pausedTimeLeftSeconds * 1000;
    try {
      const updated = await apiClient.updatePomodoro({
        status: 'running',
        targetEndTime: newTargetEndTime,
        pausedTimeLeftSeconds: null,
      });
      if (updated) {
        setSessionState(updated);
      }
    } catch (e) {
      console.error("Error continuing pomodoro:", e);
    }
  };

  const giveUpPomodoro = async () => {
    if (!user?.uid) return;

    if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);

    try {
      const updated = await apiClient.updatePomodoro({
        status: 'idle',
        targetEndTime: null,
        pausedTimeLeftSeconds: null,
        currentTaskTitle: null,
      });
      if (updated) {
        setSessionState(updated);
      }
    } catch (e) {
      console.error("Error giving up pomodoro:", e);
    }
  };

  const updateUserPreferredDuration = async (minutes: number) => {
    if (!user?.uid) return;
    const newDuration = Math.max(1, Math.min(minutes, 120));

    const updates: any = {
      userPreferredDurationMinutes: newDuration,
    };
    if (sessionState?.status === 'idle') {
      updates.currentSessionInitialDurationMinutes = newDuration;
    }

    try {
      const updated = await apiClient.updatePomodoro(updates);
      if (updated) {
        setSessionState(updated);
      }
    } catch (e) {
      console.error("Error updating duration:", e);
    }
  };

  const updateUserPreferredRestDuration = async (minutes: number) => {
    if (!user?.uid) return;
    const newRestDuration = Math.max(1, Math.min(minutes, 60));
    try {
      const updated = await apiClient.updatePomodoro({ userPreferredRestDurationMinutes: newRestDuration });
      if (updated) {
        setSessionState(updated);
      }
    } catch (e) {
      console.error("Error updating rest duration:", e);
    }
  };

  const updateNotes = async (text: string) => {
    if (!user?.uid) return;
    try {
      const updated = await apiClient.updatePomodoro({ notes: text });
      if (updated) {
        setSessionState(updated);
      }
    } catch (e) {
      console.error("Error updating notes:", e);
    }
  };

  const updateCurrentTaskTitle = async (taskTitle: string | null) => {
    if (!user?.uid) return;
    try {
      const updated = await apiClient.updatePomodoro({ currentTaskTitle: taskTitle });
      if (updated) {
        setSessionState(updated);
      }
    } catch (e) {
      console.error("Error updating pomodoro task title:", e);
    }
  };

  const handleStartRestPeriod = async (selectedOptionId: string) => {
    setIsBreakDialogOpen(false);
    if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);

    const restDurationMinutes = sessionState?.userPreferredRestDurationMinutes || DEFAULT_REST_MINUTES;
    const restTargetEndTime = Date.now() + restDurationMinutes * 60 * 1000;

    try {
      const updated = await apiClient.updatePomodoro({ restTargetEndTime });
      if (updated) {
        setSessionState(updated);
        setIsResting(true);
      }
    } catch (e) {
      console.error("Error starting rest period:", e);
    }
  };

  const skipRest = async () => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);

    try {
      const updated = await apiClient.updatePomodoro({ restTargetEndTime: null });
      if (updated) {
        setSessionState(updated);
        setIsResting(false);
      }
    } catch (e) {
      console.error("Error skipping rest:", e);
    }
  };

  return (
    <PomodoroContext.Provider value={{
      sessionState,
      timeLeftSeconds,
      isLoading: isLoading || authLoading,
      startPomodoro,
      pausePomodoro,
      continuePomodoro,
      giveUpPomodoro,
      updateUserPreferredDuration,
      updateUserPreferredRestDuration,
      updateNotes,
      updateCurrentTaskTitle,
      isResting,
      restTimeLeftSeconds,
      skipRest,
      isBreakDialogOpen,
      setIsBreakDialogOpen,
      handleStartRestPeriod,
    }}>
      {children}
      {user && !authLoading && (
        <BreakOptionsDialog
          isOpen={isBreakDialogOpen}
          onClose={() => setIsBreakDialogOpen(false)}
          onStartRest={handleStartRestPeriod}
          restDuration={sessionState?.userPreferredRestDurationMinutes || DEFAULT_REST_MINUTES}
        />
      )}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};
