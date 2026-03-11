import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/themes';
import { speak, stop } from '@/lib/speech';
import { supabase } from '@/lib/supabase';
import i18n from '@/lib/i18n';

interface QuestionContent {
  question?: string;
  hint?: string;
  options?: string[];
  answer?: string;
  elements?: string[];
}

interface QuestionActivityProps {
  content: QuestionContent;
  onComplete: () => void;
}

const ELEMENT_COLORS = [
  Colors.child.primary,
  Colors.child.secondary,
  Colors.child.purple,
  Colors.child.blue,
  Colors.child.green,
  Colors.child.orange,
];

export function QuestionActivity({ content, onComplete }: QuestionActivityProps) {
  const [showHint, setShowHint] = useState(false);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Microphone state (text-only mode)
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const micPulse = useRef(new Animated.Value(1)).current;

  const hasElements = Array.isArray(content.elements) && content.elements.length > 0;
  const hasOptions = Array.isArray(content.options) && content.options.length > 0;
  const isInteractive = hasElements || hasOptions;

  // Speak question on mount
  useEffect(() => {
    if (content.question) {
      speak(content.question);
    }
    return () => stop();
  }, [content.question]);

  // Pulsing mic animation when recording
  useEffect(() => {
    if (!isRecording) {
      micPulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.3, duration: 500, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isRecording, micPulse]);

  function handleElementTap(index: number, value: string) {
    if (tappedIndex !== null) return;
    setTappedIndex(index);

    const isCorrect = !content.answer || value === content.answer;

    if (isCorrect) {
      setCorrectIndex(index);
      const isPt = i18n.language.startsWith('pt');
      speak(isPt ? 'Muito bem!' : 'Great job!');

      Animated.sequence([
        Animated.spring(bounceAnim, { toValue: 1.3, friction: 3, tension: 100, useNativeDriver: true }),
        Animated.spring(bounceAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();

      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start();

      setTimeout(() => { stop(); onComplete(); }, 1500);
    } else {
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
        Animated.spring(bounceAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start(() => {
        setTappedIndex(null);
      });
    }
  }

  async function handleMicPress() {
    if (isRecording && recording) {
      // Stop recording
      setIsRecording(false);
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        if (uri) {
          await transcribeAudio(uri);
        }
      } catch {
        setRecording(null);
      }
    } else {
      // Start recording
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording: rec } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
        );
        setRecording(rec);
        setIsRecording(true);
        setTranscribedText('');
      } catch {
        // Recording failed
      }
    }
  }

  async function transcribeAudio(uri: string) {
    setIsTranscribing(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();

      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const b64 = result.split(',')[1];
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const lang = i18n.language.startsWith('pt') ? 'pt' : 'en';
      const { data, error } = await supabase.functions.invoke('transcribe-voice', {
        body: { audio: base64, language: lang },
      });

      if (!error && data?.text) {
        setTranscribedText(data.text);
      }
    } catch {
      // Transcription failed silently
    }
    setIsTranscribing(false);
  }

  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(78, 205, 196, 0)', 'rgba(78, 205, 196, 0.3)'],
  });

  // Interactive mode
  if (isInteractive) {
    const items = hasOptions ? content.options! : content.elements!;

    return (
      <Animated.View style={[styles.container, { backgroundColor: flashBg }]}>
        <Text style={styles.questionIcon}>🤔</Text>

        <View style={styles.bubble}>
          <Text style={styles.questionText}>{content.question ?? ''}</Text>
        </View>

        <View style={styles.elementsGrid}>
          {items.map((item, i) => {
            const isCorrectItem = correctIndex === i;
            const color = ELEMENT_COLORS[i % ELEMENT_COLORS.length];

            return (
              <Animated.View
                key={i}
                style={isCorrectItem ? { transform: [{ scale: bounceAnim }] } : undefined}
              >
                <TouchableOpacity
                  style={[
                    styles.elementCircle,
                    { backgroundColor: color },
                    isCorrectItem && styles.elementCorrect,
                    tappedIndex === i && !isCorrectItem && styles.elementWrong,
                  ]}
                  onPress={() => handleElementTap(i, item)}
                  activeOpacity={0.7}
                  disabled={tappedIndex !== null && correctIndex !== null}
                >
                  <Text style={styles.elementText}>{item}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {correctIndex !== null && (
          <Text style={styles.celebrationText}>🎉</Text>
        )}
      </Animated.View>
    );
  }

  // Fallback: text question with hint + microphone
  return (
    <View style={styles.container}>
      <Text style={styles.questionIcon}>🤔</Text>

      <View style={styles.bubble}>
        <Text style={styles.questionText}>{content.question ?? ''}</Text>
      </View>

      {content.hint && !showHint && (
        <TouchableOpacity
          style={styles.hintButton}
          onPress={() => setShowHint(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.hintButtonIcon}>💡</Text>
          <Text style={styles.hintButtonText}>?</Text>
        </TouchableOpacity>
      )}

      {showHint && (
        <View style={styles.hintBubble}>
          <Text style={styles.hintText}>{content.hint}</Text>
        </View>
      )}

      {/* Microphone button */}
      <Animated.View style={{ transform: [{ scale: micPulse }] }}>
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonRecording]}
          onPress={handleMicPress}
          activeOpacity={0.7}
          disabled={isTranscribing}
        >
          <Text style={styles.micIcon}>{isRecording ? '⏹️' : isTranscribing ? '⏳' : '🎤'}</Text>
        </TouchableOpacity>
      </Animated.View>

      {isRecording && <Text style={styles.recordingDot}>🔴</Text>}

      {transcribedText !== '' && (
        <View style={styles.transcriptBubble}>
          <Text style={styles.transcriptText}>"{transcribedText}"</Text>
        </View>
      )}

      <TouchableOpacity style={styles.doneButton} onPress={() => { stop(); onComplete(); }} activeOpacity={0.7}>
        <Text style={styles.doneIcon}>✅</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  questionIcon: {
    fontSize: 64,
  },
  bubble: {
    backgroundColor: Colors.child.accent,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
  },
  questionText: {
    fontSize: FontSizes.xxl,
    color: Colors.child.text,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 44,
  },
  elementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  elementCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elementText: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  elementCorrect: {
    borderWidth: 4,
    borderColor: Colors.child.secondary,
  },
  elementWrong: {
    opacity: 0.4,
  },
  celebrationText: {
    fontSize: 64,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.child.purple,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  hintButtonIcon: {
    fontSize: 28,
  },
  hintButtonText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hintBubble: {
    backgroundColor: '#EDE9FE',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
  },
  hintText: {
    fontSize: FontSizes.xl,
    color: Colors.child.text,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 32,
  },
  // Microphone
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.child.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonRecording: {
    backgroundColor: Colors.child.primary,
  },
  micIcon: {
    fontSize: 32,
  },
  recordingDot: {
    fontSize: 16,
  },
  transcriptBubble: {
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    width: '100%',
  },
  transcriptText: {
    fontSize: FontSizes.lg,
    color: Colors.child.text,
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  doneButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.child.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneIcon: {
    fontSize: 36,
  },
});
