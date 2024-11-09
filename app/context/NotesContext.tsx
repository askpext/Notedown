import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  color: string;
}

interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  addNote: (note: Note) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const storedNotes = await AsyncStorage.getItem("notes");
      console.log('Loaded notes:', storedNotes);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotes = async (updatedNotes: Note[]) => {
    try {
      const jsonValue = JSON.stringify(updatedNotes);
      await AsyncStorage.setItem("notes", jsonValue);
      setNotes(updatedNotes);
      console.log('Notes saved successfully:', updatedNotes);
      
      // Verify save
      const savedNotes = await AsyncStorage.getItem("notes");
      console.log('Verified saved notes:', savedNotes);
    } catch (error) {
      console.error("Error saving notes:", error);
      throw error;
    }
  };

  const addNote = async (note: Note) => {
    try {
      const updatedNotes = [note, ...notes];
      await saveNotes(updatedNotes);
    } catch (error) {
      console.error("Error adding note:", error);
      throw error;
    }
  };

  const updateNote = async (updatedNote: Note) => {
    try {
      const updatedNotes = notes.map((note) =>
        note.id === updatedNote.id
          ? {
              ...note,
              ...updatedNote,
              title: updatedNote.title.trim(),
              content: updatedNote.content.trim(),
            }
          : note
      );
      await saveNotes(updatedNotes);
      console.log('Note updated successfully:', updatedNote);
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const updatedNotes = notes.filter((note) => note.id !== id);
      await saveNotes(updatedNotes);
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  };

  return (
    <NotesContext.Provider 
      value={{ 
        notes, 
        addNote, 
        updateNote, 
        deleteNote,
        isLoading 
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
};