export type Mood = 'calm' | 'energetic' | 'sleepy' | 'curious';

export type ActivityType = 'story' | 'song' | 'minigame' | 'question' | 'drawing';

export type Goal =
  | 'letters'
  | 'numbers'
  | 'emotions'
  | 'creativity'
  | 'nature'
  | 'colors'
  | 'language_english';

export type SessionStatus = 'pending' | 'active' | 'completed' | 'abandoned';

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  birthDate: string;
  avatarUrl?: string;
}

export interface SessionConfig {
  childId: string;
  durationMinutes: 15 | 30 | 45 | 60;
  mood: Mood;
  goals: Goal[];
}

export interface Activity {
  id: string;
  sessionId: string;
  type: ActivityType;
  title: string;
  content: Record<string, unknown>;
  engagementScore?: number;
  completed: boolean;
  orderIndex: number;
}

export interface Session {
  id: string;
  childId: string;
  parentId: string;
  config: SessionConfig;
  activities: Activity[];
  status: SessionStatus;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

export interface DevelopmentReport {
  id: string;
  childId: string;
  sessionId: string;
  summary: string;
  skillsPracticed: string[];
  highlights: Record<string, unknown>;
  createdAt: string;
}
