"use client";
import type { Flashcard, FlashcardSourceDataItem, AppUser, Deck, Task, ArtifactLink, Overview } from '@/types';
import React, { createContext, useContext, ReactNode, useCallback, useMemo, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { formatISO, parseISO, subDays } from 'date-fns';
import { ApiClient } from '@/lib/api-client';
import flashcardJsonData from '../../flashcard.json';

const EMPTY_FLASHCARDS: Flashcard[] = [];
const EMPTY_DECKS: Deck[] = [];
const EMPTY_TASKS: Task[] = [];
const EMPTY_OVERVIEWS: Overview[] = [];
const DEFAULT_SEED_DECK_NAME = "Imported Vocabulary";

interface FlashcardsContextType {
  flashcards: Flashcard[];
  decks: Deck[];
  tasks: Task[];
  overviews: Overview[];

  addFlashcard: (data: { front: string; back: string; deckId?: string | null }) => Promise<Flashcard | null>;
  updateFlashcard: (id: string, updates: Partial<Omit<Flashcard, 'id'>>) => Promise<Flashcard | null>;
  deleteFlashcard: (id: string) => Promise<void>;
  getFlashcardById: (id: string) => Flashcard | undefined;

  addDeck: (name: string) => Promise<Deck | null>;
  updateDeck: (id: string, updates: Partial<Omit<Deck, 'id' | 'userId'>>) => Promise<Deck | null>;
  deleteDeck: (id: string) => Promise<void>;
  getDeckById: (id: string) => Deck | undefined;

  addTask: (data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  getCompletedTasksCountLast30Days: () => Promise<number>;
  fetchCompletedTasksLast30Days: () => Promise<Task[]>;

  addOverview: (data: { title: string; description?: string | null; artifactLink?: ArtifactLink | null }) => Promise<Overview | null>;
  updateOverview: (id: string, updates: Partial<Omit<Overview, 'id' | 'userId'>>) => Promise<Overview | null>;
  deleteOverview: (id: string) => Promise<void>;
  getOverviewById: (id: string) => Overview | undefined;

  getReviewQueue: () => Flashcard[];
  getStatistics: () => { total: number; mastered: number; learning: number; new: number; dueToday: number };
  isLoading: boolean;
  isLoadingDecks: boolean;
  isLoadingTasks: boolean;
  isLoadingOverviews: boolean;
  isSeeding: boolean;
}

const FlashcardsContext = createContext<FlashcardsContextType | undefined>(undefined);

export const FlashcardsProvider = ({ children }: { children: ReactNode }) => {
  const { user, getIdToken } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>(EMPTY_FLASHCARDS);
  const [decks, setDecks] = useState<Deck[]>(EMPTY_DECKS);
  const [tasks, setTasks] = useState<Task[]>(EMPTY_TASKS);
  const [overviews, setOverviews] = useState<Overview[]>(EMPTY_OVERVIEWS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingOverviews, setIsLoadingOverviews] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const apiClient = useMemo(() => new ApiClient(getIdToken), [getIdToken]);

  const seedInitialData = useCallback(async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      // 1. Check if we already have decks
      const currentDecks = await apiClient.getDecks();
      let seedDeckId = '';
      const existingSeedDeck = currentDecks.find(d => d.name === DEFAULT_SEED_DECK_NAME);
      if (existingSeedDeck) {
        seedDeckId = existingSeedDeck.id;
      } else {
        const createdDeck = await apiClient.createDeck({ name: DEFAULT_SEED_DECK_NAME });
        if (createdDeck) {
          seedDeckId = createdDeck.id;
          setDecks(prev => [createdDeck, ...prev]);
        }
      }

      if (!seedDeckId) return;

      const vocabulary = flashcardJsonData.vocabulary as FlashcardSourceDataItem[];
      if (vocabulary.length === 0) return;

      const cardsToSeed = vocabulary.map(item => ({
        front: item.question,
        back: item.answer,
        deckId: seedDeckId,
        nextReviewDate: formatISO(new Date(), { representation: 'date' }),
        interval: 1,
        status: 'new' as const,
        sourceQuestion: item.question,
      }));

      const seeded = await apiClient.createFlashcardsBatch(cardsToSeed);
      setFlashcards(prev => [...seeded, ...prev]);
    } catch (error) {
      console.error("Error seeding initial flashcards:", error);
    } finally {
      setIsSeeding(false);
    }
  }, [user, apiClient]);

  useEffect(() => {
    if (user && user.uid) {
      setIsLoading(true);
      setIsLoadingDecks(true);
      setIsLoadingTasks(true);
      setIsLoadingOverviews(true);

      const fetchData = async () => {
        try {
          const [fetchedCards, fetchedDecks, fetchedTasks, fetchedOverviews] = await Promise.all([
            apiClient.getFlashcards(),
            apiClient.getDecks(),
            apiClient.getTasks(),
            apiClient.getOverviews(),
          ]);

          if (fetchedCards.length === 0) {
            await seedInitialData();
            const cardsAfterSeed = await apiClient.getFlashcards();
            setFlashcards(cardsAfterSeed);
          } else {
            setFlashcards(fetchedCards);
          }
          setDecks(fetchedDecks);
          setTasks(fetchedTasks);
          setOverviews(fetchedOverviews);
        } catch (error) {
          console.error("Error fetching user data from backend API:", error);
        } finally {
          setIsLoading(false);
          setIsLoadingDecks(false);
          setIsLoadingTasks(false);
          setIsLoadingOverviews(false);
        }
      };

      fetchData();
    } else {
      setFlashcards(EMPTY_FLASHCARDS);
      setDecks(EMPTY_DECKS);
      setTasks(EMPTY_TASKS);
      setOverviews(EMPTY_OVERVIEWS);
      setIsLoading(false);
      setIsLoadingDecks(false);
      setIsLoadingTasks(false);
      setIsLoadingOverviews(false);
    }
  }, [user, apiClient, seedInitialData]);

  const addFlashcard = useCallback(async (data: { front: string; back: string; deckId?: string | null }): Promise<Flashcard | null> => {
    if (!user) return null;
    try {
      const created = await apiClient.createFlashcard({
        front: data.front,
        back: data.back,
        deckId: data.deckId || null,
        nextReviewDate: formatISO(new Date(), { representation: 'date' }),
        interval: 1,
        status: 'new',
      });
      if (created) {
        setFlashcards(prev => [created, ...prev]);
      }
      return created;
    } catch (error) {
      console.error("Error adding flashcard:", error);
      return null;
    }
  }, [user, apiClient]);

  const updateFlashcard = useCallback(async (id: string, updates: Partial<Omit<Flashcard, 'id'>>): Promise<Flashcard | null> => {
    if (!user) return null;
    try {
      const updated = await apiClient.updateFlashcard(id, updates);
      if (updated) {
        setFlashcards(prev => prev.map(f => (f.id === id ? updated : f)));
      }
      return updated;
    } catch (error) {
      console.error("Error updating flashcard:", error);
      return null;
    }
  }, [user, apiClient]);

  const deleteFlashcard = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await apiClient.deleteFlashcard(id);
      setFlashcards(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error("Error deleting flashcard:", error);
    }
  }, [user, apiClient]);

  const getFlashcardById = useCallback((id: string) => flashcards.find(card => card.id === id), [flashcards]);

  const addDeck = useCallback(async (name: string): Promise<Deck | null> => {
    if (!user) return null;
    try {
      const created = await apiClient.createDeck({ name });
      if (created) {
        setDecks(prev => [created, ...prev]);
      }
      return created;
    } catch (error) {
      console.error("Error adding deck:", error);
      return null;
    }
  }, [user, apiClient]);

  const updateDeck = useCallback(async (id: string, updates: Partial<Omit<Deck, 'id' | 'userId'>>): Promise<Deck | null> => {
    if (!user) return null;
    try {
      const updated = await apiClient.updateDeck(id, updates);
      if (updated) {
        setDecks(prev => prev.map(d => (d.id === id ? updated : d)));
      }
      return updated;
    } catch (error) {
      console.error("Error updating deck:", error);
      return null;
    }
  }, [user, apiClient]);

  const deleteDeck = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await apiClient.deleteDeck(id);
      setDecks(prev => prev.filter(d => d.id !== id));
      // Cascade delete locally since backend deletes cards where deckId == id
      setFlashcards(prev => prev.filter(f => f.deckId !== id));
    } catch (error) {
      console.error("Error deleting deck:", error);
    }
  }, [user, apiClient]);

  const getDeckById = useCallback((id: string) => decks.find(deck => deck.id === id), [decks]);

  const addTask = useCallback(async (data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Task | null> => {
    if (!user) return null;
    try {
      const created = await apiClient.createTask(data);
      if (created) {
        setTasks(prev => [created, ...prev]);
      }
      return created;
    } catch (error) {
      console.error("Error adding task:", error);
      return null;
    }
  }, [user, apiClient]);

  const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>): Promise<Task | null> => {
    if (!user) return null;
    try {
      const updated = await apiClient.updateTask(id, updates);
      if (updated) {
        setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
      }
      return updated;
    } catch (error) {
      console.error("Error updating task:", error);
      return null;
    }
  }, [user, apiClient]);

  const deleteTask = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await apiClient.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }, [user, apiClient]);

  const getTaskById = useCallback((id: string) => tasks.find(task => task.id === id), [tasks]);

  const getCompletedTasksCountLast30Days = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    try {
      const date30DaysAgo = subDays(new Date(), 30);
      return tasks.filter(t => {
        if (t.status !== 'completed' || !t.updatedAt) return false;
        try {
          return parseISO(t.updatedAt) >= date30DaysAgo;
        } catch (_) {
          return false;
        }
      }).length;
    } catch (error) {
      console.error("Error calculating completed tasks count:", error);
      return 0;
    }
  }, [user, tasks]);

  const fetchCompletedTasksLast30Days = useCallback(async (): Promise<Task[]> => {
    if (!user) return [];
    try {
      const date30DaysAgo = subDays(new Date(), 30);
      return tasks
        .filter(t => {
          if (t.status !== 'completed' || !t.updatedAt) return false;
          try {
            return parseISO(t.updatedAt) >= date30DaysAgo;
          } catch (_) {
            return false;
          }
        })
        .sort((a, b) => {
          try {
            return parseISO(b.updatedAt).getTime() - parseISO(a.updatedAt).getTime();
          } catch (_) {
            return 0;
          }
        });
    } catch (error) {
      console.error("Error fetching completed tasks:", error);
      return [];
    }
  }, [user, tasks]);

  const addOverview = useCallback(async (data: { title: string; description?: string | null; artifactLink?: ArtifactLink | null }): Promise<Overview | null> => {
    if (!user) return null;
    try {
      const created = await apiClient.createOverview(data);
      if (created) {
        setOverviews(prev => [created, ...prev]);
      }
      return created;
    } catch (error) {
      console.error("Error adding overview:", error);
      return null;
    }
  }, [user, apiClient]);

  const updateOverview = useCallback(async (id: string, updates: Partial<Omit<Overview, 'id' | 'userId'>>): Promise<Overview | null> => {
    if (!user) return null;
    try {
      const updated = await apiClient.updateOverview(id, updates);
      if (updated) {
        setOverviews(prev => prev.map(o => (o.id === id ? updated : o)));
      }
      return updated;
    } catch (error) {
      console.error("Error updating overview:", error);
      return null;
    }
  }, [user, apiClient]);

  const deleteOverview = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await apiClient.deleteOverview(id);
      setOverviews(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error("Error deleting overview:", error);
    }
  }, [user, apiClient]);

  const getOverviewById = useCallback((id: string) => overviews.find(o => o.id === id), [overviews]);

  const getReviewQueue = useCallback(() => {
    if (isLoading || !user) return [];
    const today = formatISO(new Date(), { representation: 'date' });
    return flashcards
      .filter(card => {
        if (card.status === 'mastered') return false;
        if (!card.nextReviewDate) return true;
        try {
          if (typeof card.nextReviewDate === 'string' && card.nextReviewDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return card.nextReviewDate <= today;
          }
          return true;
        } catch (e) {
          return true;
        }
      })
      .sort((a, b) => {
        const dateA = a.nextReviewDate && typeof a.nextReviewDate === 'string' && a.nextReviewDate.match(/^\d{4}-\d{2}-\d{2}$/) ? parseISO(a.nextReviewDate) : new Date(0);
        const dateB = b.nextReviewDate && typeof b.nextReviewDate === 'string' && b.nextReviewDate.match(/^\d{4}-\d{2}-\d{2}$/) ? parseISO(b.nextReviewDate) : new Date(0);
        if (dateA.getTime() < dateB.getTime()) return -1;
        if (dateA.getTime() > dateB.getTime()) return 1;
        if (a.status === 'new' && b.status !== 'new') return -1;
        if (b.status === 'new' && a.status !== 'new') return 1;
        return 0;
      });
  }, [flashcards, isLoading, user]);

  const getStatistics = useCallback(() => {
    if (isLoading || !user) return { total: 0, mastered: 0, learning: 0, new: 0, dueToday: 0 };
    const today = formatISO(new Date(), { representation: 'date' });
    const dueTodayCount = flashcards.filter(c => {
      if (c.status === 'mastered') return false;
      if (!c.nextReviewDate) return true;
      if (typeof c.nextReviewDate === 'string' && c.nextReviewDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return c.nextReviewDate <= today;
      }
      return true;
    }).length;
    return {
      total: flashcards.length,
      mastered: flashcards.filter(c => c.status === 'mastered').length,
      learning: flashcards.filter(c => c.status === 'learning').length,
      new: flashcards.filter(c => c.status === 'new').length,
      dueToday: dueTodayCount,
    };
  }, [flashcards, isLoading, user]);

  const contextValue = useMemo(() => ({
    flashcards: user ? flashcards : EMPTY_FLASHCARDS,
    decks: user ? decks : EMPTY_DECKS,
    tasks: user ? tasks : EMPTY_TASKS,
    overviews: user ? overviews : EMPTY_OVERVIEWS,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    getFlashcardById,
    addDeck,
    updateDeck,
    deleteDeck,
    getDeckById,
    addTask,
    updateTask,
    deleteTask,
    getTaskById,
    getCompletedTasksCountLast30Days,
    fetchCompletedTasksLast30Days,
    addOverview,
    updateOverview,
    deleteOverview,
    getOverviewById,
    getReviewQueue,
    getStatistics,
    isLoading: isLoading || !!(user && isSeeding),
    isLoadingDecks: isLoadingDecks || !!(user && isSeeding),
    isLoadingTasks: isLoadingTasks || !!(user && isSeeding),
    isLoadingOverviews: isLoadingOverviews || !!(user && isSeeding),
    isSeeding,
  }), [
    flashcards,
    decks,
    tasks,
    overviews,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    getFlashcardById,
    addDeck,
    updateDeck,
    deleteDeck,
    getDeckById,
    addTask,
    updateTask,
    deleteTask,
    getTaskById,
    getCompletedTasksCountLast30Days,
    fetchCompletedTasksLast30Days,
    addOverview,
    updateOverview,
    deleteOverview,
    getOverviewById,
    getReviewQueue,
    getStatistics,
    isLoading,
    isLoadingDecks,
    isLoadingTasks,
    isLoadingOverviews,
    user,
    isSeeding,
  ]);

  return (
    <FlashcardsContext.Provider value={contextValue}>
      {children}
    </FlashcardsContext.Provider>
  );
};

export const useFlashcards = () => {
  const context = useContext(FlashcardsContext);
  if (context === undefined) {
    throw new Error('useFlashcards must be used within a FlashcardsProvider');
  }
  return context;
};