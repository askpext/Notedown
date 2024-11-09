import { NotesProvider } from "./context/NotesContext";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <NotesProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </NotesProvider>
  );
}
