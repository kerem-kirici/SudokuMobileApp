import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useRef } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface DifficultySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DifficultySelector({ 
  visible, 
  onClose, 
  onSelectDifficulty 
}: DifficultySelectorProps) {
  // ref
  const bottomSheetRef = useRef<BottomSheet>(null);

  // variables
  const snapPoints = useMemo(() => ['50%', '60%'], []);

  // callbacks
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const handleDifficultySelect = (difficulty: Difficulty) => {
    onSelectDifficulty(difficulty);
    onClose();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return '#4CAF50';
      case 'Medium':
        return '#FF9800';
      case 'Hard':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getDifficultyIcon = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'leaf';
      case 'Medium':
        return 'flame';
      case 'Hard':
        return 'skull';
      default:
        return 'help-circle';
    }
  };

  // Open/close bottom sheet based on visible prop
  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Title */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Select Difficulty</Text>
          <Text style={styles.subtitle}>Choose your challenge level</Text>
        </View>

        {/* Difficulty Options */}
        <View style={styles.optionsContainer}>
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((difficulty) => (
            <TouchableOpacity
              key={difficulty}
              style={[
                styles.difficultyOption,
                { borderColor: getDifficultyColor(difficulty) }
              ]}
              onPress={() => handleDifficultySelect(difficulty)}
              activeOpacity={0.7}
            >
              <View style={styles.difficultyContent}>
                <Ionicons 
                  name={getDifficultyIcon(difficulty) as any} 
                  size={Math.min(24, SCREEN_HEIGHT * 0.03)} 
                  color={getDifficultyColor(difficulty)} 
                />
                <View style={styles.difficultyTextContainer}>
                  <Text style={styles.difficultyText}>{difficulty}</Text>
                  <Text style={styles.difficultyDescription}>
                    {difficulty === 'Easy' && 'Perfect for beginners'}
                    {difficulty === 'Medium' && 'For experienced players'}
                    {difficulty === 'Hard' && 'Ultimate challenge'}
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={Math.min(20, SCREEN_HEIGHT * 0.025)} 
                  color="rgba(255, 255, 255, 0.6)" 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cancel Button */}
        <View style={styles.cancelButtonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: Math.min(40, SCREEN_WIDTH * 0.1),
    height: Math.min(4, SCREEN_HEIGHT * 0.005),
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Math.min(20, SCREEN_WIDTH * 0.05),
    paddingTop: Math.min(20, SCREEN_HEIGHT * 0.025),
    paddingBottom: Math.min(30, SCREEN_HEIGHT * 0.04),
  },
  headerSection: {
    marginBottom: Math.min(30, SCREEN_HEIGHT * 0.035),
  },
  title: {
    fontSize: Math.min(24, SCREEN_HEIGHT * 0.03),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: Math.min(8, SCREEN_HEIGHT * 0.01),
  },
  subtitle: {
    fontSize: Math.min(16, SCREEN_HEIGHT * 0.02),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: Math.min(12, SCREEN_HEIGHT * 0.015),
    marginBottom: Math.min(20, SCREEN_HEIGHT * 0.025),
  },
  difficultyOption: {
    borderWidth: 2,
    borderRadius: Math.min(12, SCREEN_HEIGHT * 0.015),
    padding: Math.min(16, SCREEN_HEIGHT * 0.02),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  difficultyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.min(12, SCREEN_WIDTH * 0.03),
  },
  difficultyTextContainer: {
    flex: 1,
  },
  difficultyText: {
    fontSize: Math.min(18, SCREEN_HEIGHT * 0.022),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: Math.min(2, SCREEN_HEIGHT * 0.002),
  },
  difficultyDescription: {
    fontSize: Math.min(14, SCREEN_HEIGHT * 0.017),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cancelButtonContainer: {
    paddingBottom: Math.min(10, SCREEN_HEIGHT * 0.012),
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: Math.min(14, SCREEN_HEIGHT * 0.017),
    borderRadius: Math.min(12, SCREEN_HEIGHT * 0.015),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontSize: Math.min(16, SCREEN_HEIGHT * 0.02),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
}); 