import { ActivityType } from '@/types';
import { Colors } from './themes';

interface ActivityTypeConfig {
  label: string;
  icon: string;
  color: string;
}

export const ACTIVITY_TYPES: Record<ActivityType, ActivityTypeConfig> = {
  story: {
    label: 'História',
    icon: '📖',
    color: Colors.child.purple,
  },
  song: {
    label: 'Música',
    icon: '🎵',
    color: Colors.child.blue,
  },
  minigame: {
    label: 'Joguinho',
    icon: '🎮',
    color: Colors.child.green,
  },
  question: {
    label: 'Pergunta',
    icon: '❓',
    color: Colors.child.orange,
  },
  drawing: {
    label: 'Desenho',
    icon: '🎨',
    color: Colors.child.primary,
  },
};

export const DURATION_OPTIONS: { value: 15 | 30 | 45 | 60; label: string }[] = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];

export const MOOD_OPTIONS: { value: 'calm' | 'energetic' | 'sleepy' | 'curious'; label: string; icon: string }[] = [
  { value: 'calm', label: 'Calma', icon: '😌' },
  { value: 'energetic', label: 'Agitada', icon: '🤸' },
  { value: 'sleepy', label: 'Sonolenta', icon: '😴' },
  { value: 'curious', label: 'Curiosa', icon: '🤔' },
];

export const GOAL_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'letters', label: 'Letras', icon: '🔤' },
  { value: 'numbers', label: 'Números', icon: '🔢' },
  { value: 'emotions', label: 'Emoções', icon: '🎭' },
  { value: 'creativity', label: 'Criatividade', icon: '🎨' },
  { value: 'nature', label: 'Natureza', icon: '🌿' },
  { value: 'colors', label: 'Cores', icon: '🌈' },
  { value: 'language_english', label: 'Inglês', icon: '🇺🇸' },
];
