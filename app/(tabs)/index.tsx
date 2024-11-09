import React from "react";
import { useFonts } from 'expo-font';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Note, useNotes } from "../context/NotesContext";


const { width } = Dimensions.get("window");
const PADDING = 10;
const CARD_MARGIN = 8;
const COLUMN_WIDTH = (width - PADDING * 2 - CARD_MARGIN * 2) / 2;

const createGlowAnimation = () => {
  const glowAnim = new Animated.Value(0);
  Animated.loop(
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ])
  ).start();
  return glowAnim;
};

const NoteCard = ({
  note,
  size,
  isCircle = false,
}: {
  note: Note;
  size: "small" | "medium" | "large";
  isCircle?: boolean;
}) => {
  const glowAnim = React.useRef(createGlowAnimation()).current;

  const animatedStyle = {
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [3, 7],
    }),
  };

  const cardStyle = [
    styles.noteCard,
    animatedStyle,
    size === "small" && styles.smallCard,
    size === "medium" && styles.mediumCard,
    size === "large" && styles.largeCard,
    isCircle && styles.circleCard,
  ];

  return (
    <Link
      href={{
        pathname: "./note/[id]",
        params: {
          id: note.id,
          title: note.title,
          content: note.content,
          date: note.date,
          color: note.color,
        },
      }}
      asChild
    >
      <TouchableOpacity>
        <Animated.View style={cardStyle}>
          <Text style={styles.noteTitle} numberOfLines={1}>
            {note.title}
          </Text>
          <Text
            style={styles.noteContent}
            numberOfLines={isCircle ? 3 : size === "small" ? 2 : 4}
          >
            {note.content}
          </Text>
          <Text style={styles.noteDate}>{note.date}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Link>
  );
};

export default function NotesScreen() {
  const [fontsLoaded] = useFonts({
    "Press Start 2P": require("@/assets/fonts/PressStart2P-Regular.ttf"),
  });
  
  const { notes, addNote } = useNotes();

  const handleAddNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: "New Note",
      content: "Write your heart out...",
      date: new Date().toLocaleDateString(),
      color: "#000000",
    };
    addNote(newNote);
  };

  const renderBentoGrid = () => {
    const bentoGrid = [];
    for (let i = 0; i < notes.length; i += 5) {
      bentoGrid.push(
        <View key={i} style={styles.bentoRow}>
          <View style={styles.bentoColumn}>
            {notes[i] && <NoteCard note={notes[i]} size="medium" />}
            {notes[i + 1] && (
              <NoteCard note={notes[i + 1]} size="small" isCircle={true} />
            )}
          </View>
          <View style={styles.bentoColumn}>
            {notes[i + 2] && <NoteCard note={notes[i + 2]} size="small" />}
            {notes[i + 3] && (
              <NoteCard note={notes[i + 3]} size="small" isCircle={true} />
            )}
            {notes[i + 4] && <NoteCard note={notes[i + 4]} size="small" />}
          </View>
        </View>
      );
    }
    return bentoGrid;
  };

  const renderSimpleList = () => {
    return notes.map((note: Note) => (
      <NoteCard key={note.id} note={note} size="large" />
    ));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Text style={styles.headerDown}>NOTE</Text>
          <Text style={styles.headerDown}>DOWN</Text>
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.notesList}>
        {notes.length > 2 ? renderBentoGrid() : renderSimpleList()}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddNote}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#121212",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    flexDirection: "row",
  },
  headerText: {
    fontSize: 32,
    fontWeight: "normal",
    color: "#fff",
    fontFamily: "handwriting"
  },
  headerDown: {
    fontSize: 28,
    fontWeight: "normal",
    color: "#fff",
    fontFamily: "Press Start 2P",
  },
  notesList: {
    padding: PADDING,
  },
  bentoRow: {
    flexDirection: "row",
    marginBottom: CARD_MARGIN,
  },
  bentoColumn: {
    flex: 1,
    marginHorizontal: CARD_MARGIN / 2,
  },
  noteCard: {
    backgroundColor: "#000000",
    borderRadius: 15,
    padding: 15,
    marginBottom: CARD_MARGIN,
    borderWidth: 1,
    borderColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  smallCard: {
    height: COLUMN_WIDTH,
  },
  mediumCard: {
    height: COLUMN_WIDTH * 1.2,
  },
  largeCard: {
    height: COLUMN_WIDTH * 0.7,
  },
  circleCard: {
    borderRadius: COLUMN_WIDTH / 2,
    height: COLUMN_WIDTH,
    width: COLUMN_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#fff",
  },
  noteContent: {
    fontSize: 14,
    color: "#e0e0e0",
    marginBottom: 12,
  },
  noteDate: {
    fontSize: 12,
    color: "#bdbdbd",
  },
  fab: {
    position: "absolute",
    right: 30,
    bottom: 30,
    backgroundColor: "#000000",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  fabText: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "bold",
  },
});
