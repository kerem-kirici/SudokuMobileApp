import { Colors } from '@/types/theme';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface NumberPadProps {
  onNumberPress: (number: number) => void;
  numberCounter: { [key: number]: number };
  isNotesMode: boolean;
}

export default function NumberPad({ onNumberPress, numberCounter, isNotesMode }: NumberPadProps) {
  const width = Dimensions.get('window').width;
  // Make buttons even bigger and square
  const buttonSize = (width - 5 * 8) / 9; // reduce spacing even more for bigger buttons

  return (
    <View style={[styles.numberPad, { paddingHorizontal: buttonSize / 16 }]}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
        <TouchableOpacity
          key={number}
          style={[
            {
              width: buttonSize,
              height: buttonSize*1.2,
              borderRadius: 8, // less rounded for square look
              margin: buttonSize / 32, // reduce margin for bigger buttons
            },
            styles.numberButton,
            numberCounter && numberCounter[number] === 9 && styles.disabledButton,
          ]}
          onPress={() => onNumberPress(number)}
          disabled={numberCounter && numberCounter[number] === 9 ? true : false}
          activeOpacity={0.7}
        >
          <Text style={[
            isNotesMode ? styles.numberBottonNotesText : styles.numberButtonText,
            numberCounter && numberCounter[number] === 9 && styles.disabledButtonText,
          ]}>{number}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  numberPad: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    minHeight: Dimensions.get('window').height * 0.1, // increase margin bottom
  },
  numberButton: {
    margin: 2,
    backgroundColor: Colors.surface.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  numberButtonText: {
    color: Colors.text.primary,
    fontSize: 22,
    fontFamily: 'Arial',
    fontWeight: 'bold',
  },
  numberBottonNotesText: {
    color: Colors.text.notesButtons,
    fontSize: 22,
    fontFamily: 'Arial',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: Colors.surface.tertiary,
    opacity: 0.5,
  },
  disabledButtonText: {
    color: Colors.text.disabled,
  },
}); 