import React, { createContext, useContext, useEffect, useState } from "react";
import { StorageService } from "@/services/storage";
import { Note } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface NotesContextValue {
  notes: Note[];
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextValue>({
  notes: [],
  addNote: async () => {},
  updateNote: async () => {},
  deleteNote: async () => {},
});

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email) {
      setNotes([]);
      return;
    }

    const emailKey = `${StorageService.NOTES_KEY}_${user.email}`;

    StorageService.get<Note[]>(emailKey).then(async (saved) => {
      if (saved && saved.length > 0) {
        setNotes(saved);
      } else {
        // Fallback to old key if migrating
        const oldSaved = await StorageService.get<Note[]>(StorageService.NOTES_KEY);
        if (oldSaved && oldSaved.length > 0) {
          setNotes(oldSaved);
          await StorageService.set(emailKey, oldSaved); // Migrate
        } else {
          setNotes([]);
        }
      }
    });
  }, [user?.email]);

  const saveNotes = async (updated: Note[]) => {
    setNotes(updated);
    if (user?.email) {
      await StorageService.set(`${StorageService.NOTES_KEY}_${user.email}`, updated);
    }
  };

  const addNote = async (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveNotes([newNote, ...notes]);
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    );
    await saveNotes(updated);
  };

  const deleteNote = async (id: string) => {
    await saveNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  return useContext(NotesContext);
}
