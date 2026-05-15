import React, { createContext, useContext, useEffect, useState } from "react";
import { StorageService } from "@/services/storage";
import { MudzakarahTopic, MudzakarahJawaban } from "@/types";
import { DUMMY_MUDZAKARAH } from "@/services/dummyData";

interface MudzakarahContextValue {
  topics: MudzakarahTopic[];
  addTopic: (topic: Omit<MudzakarahTopic, "id" | "createdAt" | "jawaban">) => Promise<void>;
  addJawaban: (topicId: string, jawaban: Omit<MudzakarahJawaban, "id" | "createdAt" | "topicId">) => Promise<void>;
}

const MudzakarahContext = createContext<MudzakarahContextValue>({
  topics: [],
  addTopic: async () => {},
  addJawaban: async () => {},
});

export function MudzakarahProvider({ children }: { children: React.ReactNode }) {
  const [topics, setTopics] = useState<MudzakarahTopic[]>([]);

  useEffect(() => {
    StorageService.get<MudzakarahTopic[]>(StorageService.MUDZAKARAH_KEY).then((saved) => {
      if (saved && saved.length > 0) {
        setTopics(saved);
      } else {
        setTopics(DUMMY_MUDZAKARAH);
        StorageService.set(StorageService.MUDZAKARAH_KEY, DUMMY_MUDZAKARAH);
      }
    });
  }, []);

  const saveTopics = async (updated: MudzakarahTopic[]) => {
    setTopics(updated);
    await StorageService.set(StorageService.MUDZAKARAH_KEY, updated);
  };

  const addTopic = async (topic: Omit<MudzakarahTopic, "id" | "createdAt" | "jawaban">) => {
    const newTopic: MudzakarahTopic = {
      ...topic,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      jawaban: [],
    };
    await saveTopics([newTopic, ...topics]);
  };

  const addJawaban = async (topicId: string, jawaban: Omit<MudzakarahJawaban, "id" | "createdAt" | "topicId">) => {
    const newJawaban: MudzakarahJawaban = {
      ...jawaban,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      topicId,
      createdAt: new Date().toISOString(),
    };
    const updated = topics.map((t) =>
      t.id === topicId ? { ...t, jawaban: [...t.jawaban, newJawaban] } : t
    );
    await saveTopics(updated);
  };

  return (
    <MudzakarahContext.Provider value={{ topics, addTopic, addJawaban }}>
      {children}
    </MudzakarahContext.Provider>
  );
}

export function useMudzakarah() {
  return useContext(MudzakarahContext);
}
