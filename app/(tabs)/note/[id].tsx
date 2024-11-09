import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useNotes } from "@/app/context/NotesContext";
import { ArrowLeft, Trash2, Share2 } from "lucide-react-native";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  color: string;
}

interface ViewShotRef {
  capture: () => Promise<string>;
}

export default function NoteDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { updateNote, deleteNote } = useNotes();

  const id = params.id as string;
  const initialTitle = (params.title as string) || "";
  const initialContent = (params.content as string) || "";
  const color = (params.color as string) || "#000000";

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isUnsavedModalVisible, setIsUnsavedModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<ViewShot & ViewShotRef>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setHasChanges(true);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateNote({
        id,
        title,
        content,
        date: new Date().toLocaleDateString(),
        color,
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving note:", error);
      Alert.alert(
        "Error",
        "Failed to save note. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNote(id);
      setIsDeleteModalVisible(false);
      router.back();
    } catch (error) {
      console.error("Error deleting note:", error);
      Alert.alert(
        "Error",
        "Failed to delete note. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleShare = async () => {
    if (!viewShotRef.current) {
      Alert.alert("Error", "Unable to capture note for sharing");
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Error", "Sharing is not available on this device");
        return;
      }

      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share Note Screenshot",
      });
    } catch (error) {
      console.error("Error sharing screenshot:", error);
      Alert.alert(
        "Error",
        "Failed to share note. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      setIsUnsavedModalVisible(true);
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: color }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            {hasChanges && (
              <TouchableOpacity
                style={[styles.iconButton, styles.marginRight]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.iconButton, styles.marginRight]}
              onPress={handleShare}
            >
              <Share2 color="#fff" size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsDeleteModalVisible(true)}
            >
              <Trash2 color="#fff" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <ViewShot
          ref={viewShotRef}
          options={{
            format: "png",
            quality: 1.0,
          }}
          style={styles.noteContent}
        >
          <ScrollView
            style={styles.scrollView}
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={handleTitleChange}
              placeholder="Note Title"
              placeholderTextColor="#999"
              multiline
              maxLength={100}
            />
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={handleContentChange}
              placeholder="Start typing..."
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </ViewShot>
      </Animated.View>

      {/* Delete Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Note</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this note?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Unsaved Changes Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isUnsavedModalVisible}
        onRequestClose={() => setIsUnsavedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Unsaved Changes</Text>
            <Text style={styles.modalMessage}>
              Would you like to save your changes before leaving?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsUnsavedModalVisible(false);
                  router.back();
                }}
              >
                <Text style={styles.cancelButtonText}>Don't Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={async () => {
                  await handleSave();
                  setIsUnsavedModalVisible(false);
                  router.back();
                }}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  iconButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  marginRight: {
    marginRight: 10,
  },
  noteContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    padding: 0,
    marginBottom: 20,
  },
  contentInput: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 24,
    padding: 0,
    minHeight: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#000",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
    borderColor: "#333",
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#ccc",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#333",
  },
  deleteButton: {
    backgroundColor: "#ff4444",
  },
  saveModalButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});