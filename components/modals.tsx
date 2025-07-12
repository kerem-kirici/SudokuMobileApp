import { Colors } from '@/types/theme';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PauseModalProps {
  visible: boolean;
  elapsedTime: number;
  onResume: () => void;
  formatTime: (seconds: number) => string;
}

interface GameOverModalProps {
  visible: boolean;
  elapsedTime: number;
  onRestart: () => void;
  onBackToMenu: () => void;
  formatTime: (seconds: number) => string;
}

interface CompletionModalProps {
  visible: boolean;
  elapsedTime: number;
  onRestart: () => void;
  onBackToMenu: () => void;
  formatTime: (seconds: number) => string;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  visible,
  elapsedTime,
  onResume,
  formatTime,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Game Paused</Text>
          <Text style={styles.modalTime}>Time: {formatTime(elapsedTime)}</Text>
          <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.resumeButton}
            onPress={onResume}
            activeOpacity={0.7}
          >
              <Text style={styles.resumeButtonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const CompletionModal: React.FC<CompletionModalProps> = ({
  visible,
  elapsedTime,
  onRestart,
  onBackToMenu,
  formatTime,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🎉 Congratulations Kerem!</Text>
          <Text style={styles.modalSubtitle}>You&apos;ve solved the Sudoku puzzle!</Text>
          <Text style={styles.modalTime}>Time: {formatTime(elapsedTime)}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={onRestart}
              activeOpacity={0.7}
            >
              <Text style={styles.resumeButtonText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackToMenu}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Back to Menu</Text>
          </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  elapsedTime,
  onRestart,
  onBackToMenu,
  formatTime,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Game Over</Text>
          <Text style={styles.modalTime}>Time: {formatTime(elapsedTime)}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={onRestart}
              activeOpacity={0.7}
            >
              <Text style={styles.resumeButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackToMenu}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.surface.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: Colors.surface.modal,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border.primary,
    minWidth: 250,
    shadowColor: Colors.shadow.primary,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalTime: {
    fontSize: 18,
    color: Colors.text.secondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  resumeButton: {
    backgroundColor: Colors.button.primary.background,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.button.primary.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resumeButtonText: {
    color: Colors.button.primary.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: Colors.button.secondary.background,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.button.secondary.border,
  },
  backButtonText: {
    color: Colors.button.secondary.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 