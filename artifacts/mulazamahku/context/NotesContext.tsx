import React, { createContext, useContext, useEffect, useState } from "react";
import { StorageService } from "@/services/storage";
import { Note } from "@/types";

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

  useEffect(() => {
    StorageService.get<Note[]>(StorageService.NOTES_KEY).then((saved) => {
      if (saved && saved.length > 0) {
        setNotes(saved);
      } else {
        const sample: Note[] = [
          {
            id: "n1",
            judul: "Faedah Tafsir Al-Mulk",
            isi: "Siapa yang membaca surat Al-Mulk setiap malam, Allah akan menghalanginya dari azab kubur. (HR. At-Tirmidzi)\n\nHikmah: Konsistensi ibadah meski ringan lebih dicintai Allah daripada yang banyak tapi terputus.",
            kajianId: "1",
            kajianJudul: "Tafsir Al-Quran Juz 30",
            createdAt: "2026-05-08T09:00:00Z",
            updatedAt: "2026-05-08T09:00:00Z",
            tags: ["tafsir", "amalan"],
          },
          {
            id: "n2",
            judul: "Keutamaan Menuntut Ilmu",
            isi: "Barangsiapa menempuh jalan untuk menuntut ilmu, Allah akan memudahkan baginya jalan menuju surga. (HR. Muslim)\n\nNote: Niat harus ikhlas karena Allah, bukan untuk dipuji.",
            kajianId: "2",
            kajianJudul: "Hadits Arbain Nawawi",
            createdAt: "2026-05-07T10:30:00Z",
            updatedAt: "2026-05-07T10:30:00Z",
            tags: ["hadits", "ilmu"],
          },
        ];
        setNotes(sample);
        StorageService.set(StorageService.NOTES_KEY, sample);
      }
    });
  }, []);

  const saveNotes = async (updated: Note[]) => {
    setNotes(updated);
    await StorageService.set(StorageService.NOTES_KEY, updated);
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
