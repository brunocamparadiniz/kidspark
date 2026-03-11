import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/themes';
import { speak, stop } from '@/lib/speech';

interface DrawingContent {
  prompt?: string;
  colors?: string[];
}

interface DrawingActivityProps {
  content: DrawingContent;
  onComplete: () => void;
}

interface StrokePath {
  d: string;
  color: string;
}

const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#6BCB77', '#4D96FF'];

export function DrawingActivity({ content, onComplete }: DrawingActivityProps) {
  const colors = content.colors ?? DEFAULT_COLORS;
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [paths, setPaths] = useState<StrokePath[]>([]);
  const [currentPath, setCurrentPath] = useState('');

  // Speak the prompt on mount
  useEffect(() => {
    if (content.prompt) {
      speak(content.prompt);
    }
    return () => stop();
  }, [content.prompt]);

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onStart((e) => {
      setCurrentPath(`M${e.x},${e.y}`);
    })
    .onUpdate((e) => {
      setCurrentPath((prev) => `${prev} L${e.x},${e.y}`);
    })
    .onEnd(() => {
      if (currentPath) {
        setPaths((prev) => [...prev, { d: currentPath, color: selectedColor }]);
        setCurrentPath('');
      }
    });

  const handleClear = useCallback(() => {
    setPaths([]);
    setCurrentPath('');
  }, []);

  function handleComplete() {
    stop();
    onComplete();
  }

  return (
    <View style={styles.container}>
      <View style={styles.promptBubble}>
        <Text style={styles.promptIcon}>🎨</Text>
        <Text style={styles.promptText}>{content.prompt ?? ''}</Text>
      </View>

      <GestureDetector gesture={panGesture}>
        <View style={styles.canvas}>
          <Svg style={StyleSheet.absoluteFill}>
            {paths.map((stroke, i) => (
              <Path
                key={i}
                d={stroke.d}
                stroke={stroke.color}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {currentPath ? (
              <Path
                d={currentPath}
                stroke={selectedColor}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </Svg>
        </View>
      </GestureDetector>

      <View style={styles.toolbar}>
        <View style={styles.paletteRow}>
          {colors.map((color, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSelectedColor(color)}
              activeOpacity={0.7}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                selectedColor === color && styles.colorDotSelected,
              ]}
            />
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear} activeOpacity={0.7}>
            <Text style={styles.clearIcon}>🗑️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneButton} onPress={handleComplete} activeOpacity={0.7}>
            <Text style={styles.doneIcon}>✅</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  promptBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.child.accent,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  promptIcon: {
    fontSize: 28,
  },
  promptText: {
    fontSize: FontSizes.lg,
    color: Colors.child.text,
    fontWeight: '700',
    flex: 1,
  },
  canvas: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    borderColor: Colors.child.secondary,
    overflow: 'hidden',
  },
  toolbar: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  colorDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: Colors.child.text,
    transform: [{ scale: 1.15 }],
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  clearButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    fontSize: 28,
  },
  doneButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.child.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneIcon: {
    fontSize: 28,
  },
});
