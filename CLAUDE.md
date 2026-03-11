# CLAUDE.md — KidSpark
> Read this entire file before doing anything.
> Leia este arquivo inteiro antes de qualquer tarefa.

---

## What is KidSpark

**KidSpark** is an educational mobile app for children aged 2–5.
A parent sets up a session in seconds; the AI creates and leads interactive activities adapted to available time, the child's mood, and learning goals. At the end, the parent receives a development report.

**Problem it solves:** parents need time, kids will use screens anyway — this app makes screen time intentional, educational, and guilt-free.

**Language:** The app supports Portuguese (pt-BR) and English (en). All user-facing strings go through the i18n system (i18next + react-i18next). Default language: detected from device locale, fallback English.

---

## Current State (March 2026)

### What's working
- **Auth**: Login and registration with Supabase Auth + AsyncStorage persistence
- **Parent dashboard**: Child list, child creation (DD/MM/YYYY date picker), session setup, reports link
- **Session setup**: Duration/mood/goals selectors → AI generates activities via Edge Function
- **Child session UI**: Full interactive session player with progress dots, activity transitions, celebration screen
- **Activity types**: Story (auto-read + auto-advance), Song (lyric-by-lyric TTS + pop sound), Question (tappable elements + microphone), Drawing (finger-drawing canvas with color palette)
- **Text-to-speech**: expo-speech integrated in all activities + session greeting
- **Voice input**: Microphone recording → Whisper transcription via Edge Function (in Question activities)
- **Reports**: Auto-generated after session completion, viewable per child with skills/engagement/recommendations
- **i18n**: Full pt-BR and en support, language switcher in settings
- **Settings screen**: Language switch + logout
- **Edge Functions**: generate-session, generate-report, transcribe-voice — all deployed with CORS headers, Haiku model, markdown fence stripping
- **State management**: Zustand stores for auth, child, session, reports
- **Database**: RLS policies including profiles INSERT, profile creation trigger

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| Mobile | Expo (React Native) + TypeScript | Expo 54, React 19, RN 0.81 |
| Backend/Auth/DB | Supabase | supabase-js 2.39 |
| State management | Zustand | 4.5 |
| Navigation | Expo Router (file-based) | 6.0 |
| AI — sessions | Anthropic Claude API (Haiku) | Via Supabase Edge Functions |
| AI — voice | OpenAI Whisper API | Via Supabase Edge Functions |
| TTS | expo-speech | ~14.0 |
| Audio recording | expo-av | ~16.0 |
| Drawing canvas | react-native-gesture-handler + react-native-svg | ~2.28 / 15.12 |
| i18n | i18next + react-i18next + expo-localization | Installed |
| Styling | React Native StyleSheet | Used throughout (NativeWind NOT used) |

---

## Folder Structure (actual)

```
kidspark/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx         # Stack, no header
│   │   ├── login.tsx           # Email + password login
│   │   └── register.tsx        # Name + email + password signup
│   ├── (child)/
│   │   ├── _layout.tsx         # Full screen, hidden StatusBar, child palette
│   │   └── session.tsx         # Session player: greeting → activities → celebration
│   ├── (parent)/
│   │   ├── _layout.tsx         # Stack, no header
│   │   ├── index.tsx           # Dashboard: children list, add child, session + reports links
│   │   ├── setup-session.tsx   # Duration, mood, goals → creates session → navigates to child
│   │   ├── reports.tsx         # Reports per child: skills, engagement, recommendations
│   │   └── settings.tsx        # Language switcher + logout
│   ├── _layout.tsx             # Root: GestureHandlerRootView, initializes auth + i18n
│   └── index.tsx               # Redirect: authenticated → (parent), else → (auth)/login
├── assets/
│   └── pop.wav                 # Pop sound for SongActivity tap feedback
├── components/
│   ├── child/
│   │   ├── StoryActivity.tsx   # Auto-read pages with TTS, auto-advance after speech
│   │   ├── SongActivity.tsx    # Lyric-by-lyric TTS, pop sound on tap, bouncing animation
│   │   ├── QuestionActivity.tsx # Tappable elements/options, microphone recording, transcription
│   │   └── DrawingActivity.tsx # Finger-drawing canvas with color palette, SVG paths
│   └── shared/
│       ├── Button.tsx          # primary/secondary/outline, sm/md/lg
│       ├── Card.tsx            # Simple card wrapper
│       └── Input.tsx           # Labeled text input
├── constants/
│   ├── activity-types.ts       # ACTIVITY_TYPES, DURATION_OPTIONS, MOOD_OPTIONS, GOAL_OPTIONS
│   └── themes.ts               # Colors (parent + child), Spacing, FontSizes, BorderRadius
├── hooks/
│   ├── useAuth.ts              # Wraps auth store
│   ├── useChildProfile.ts      # Fetches children on auth, wraps child store
│   ├── useReports.ts           # Wraps report store
│   └── useSession.ts           # Wraps session store (create, completeActivity, completeSession)
├── lib/
│   ├── i18n.ts                 # i18next init with pt-BR + en, device locale detection
│   ├── speech.ts               # TTS helper: speak(), stop(), isSpeaking() via expo-speech
│   └── supabase.ts             # Supabase client with AsyncStorage
├── locales/
│   ├── en.json                 # English translations
│   └── pt-BR.json              # Portuguese translations
├── stores/
│   ├── auth.store.ts           # User, profile, signIn/signUp/signOut, onAuthStateChange
│   ├── child.store.ts          # Children list, addChild, selectChild
│   ├── report.store.ts         # Reports list, fetchReports, addReport
│   └── session.store.ts        # Create session, completeActivity, completeSession → triggers report
├── supabase/
│   ├── functions/
│   │   ├── generate-session/index.ts  # Claude Haiku → activity JSON, CORS, fence stripping
│   │   ├── generate-report/index.ts   # Claude Haiku → development report, language-aware
│   │   └── transcribe-voice/index.ts  # OpenAI Whisper → text transcription
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_fix_profiles_insert_policy.sql
├── types/index.ts              # Profile, Child, Session, Activity, DevelopmentReport
├── app.json                    # scheme: "kidspark"
├── package.json
├── tsconfig.json               # strict, paths: @/ → ./
└── CLAUDE.md
```

---

## Database (Supabase / Postgres)

### Tables (from migrations)

profiles, children, sessions, session_activities, development_reports — all with RLS enabled.

The profiles INSERT policy was added in `002_fix_profiles_insert_policy.sql`.

### Profile creation trigger

The migration includes `handle_new_user()` that auto-creates a profile on signup (SECURITY DEFINER).

### Column name mapping (DB snake_case → TS camelCase)

parent_id → parentId, birth_date → birthDate, avatar_url → avatarUrl, created_at → createdAt, session_id → sessionId, activity_type → type, order_index → orderIndex, engagement_score → engagementScore, full_name → fullName, duration_minutes → durationMinutes, skills_practiced → skillsPracticed

---

## Environment Variables

`.env.local` at project root (gitignored):
```
EXPO_PUBLIC_SUPABASE_URL=https://hxinhsbctuaujnrgjzhw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Edge Function secrets (Supabase Dashboard > Edge Functions > Secrets):
```
ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
```

API keys must NEVER be in client code. All AI calls go through Edge Functions.

---

## Session Engine Flow

```
Parent configures session (setup-session.tsx)
      ↓
session.store.ts creates session row in Supabase
      ↓
session.store.ts calls Edge Function (generate-session) with config + childName + language
      ↓
Edge Function calls Claude Haiku with structured prompt
      ↓
Claude returns activity list as JSON (markdown fences stripped before parse)
      ↓
session.store.ts saves activities to session_activities table
      ↓
Router navigates to (child)/session.tsx
      ↓
Child UI renders greeting → activities one by one → celebration
      ↓
completeSession() triggers generate-report Edge Function in background
      ↓
Report saved to development_reports table, viewable in (parent)/reports.tsx
```

---

## Code Conventions

- Strict TypeScript — no `any`, no `@ts-ignore`
- Functional components only
- PascalCase components, camelCase functions/variables
- Always async/await, never .then().catch()
- Always handle errors: `const { data, error } = ...; if (error) { ... }`
- Comments explain "why", not "what"
- Imports via `@/`
- All user-facing strings via i18n t()
- Supabase: always destructure { data, error } and handle both

---

## UX / Design

### Parent Panel
- White bg (#FFFFFF), dark primary (#1A1A2E), warm accent (#E8874A), surface (#F5F5F7)
- Rounded corners (8–16px), spacing multiples of 8

### Child Mode
- Full screen, bright colors: coral (#FF6B6B), teal (#4ECDC4), yellow (#FFE66D)
- Large touch targets (44x44 min), icons + voice, minimal text
- TTS reads all content aloud, auto-advance where appropriate

---

## Development Phases

### Phase 1 — Foundation (DONE)
- [x] Expo + TypeScript + Expo Router
- [x] Supabase client + SQL migration
- [x] Login / Registration
- [x] Parent dashboard + child management
- [x] Session setup screen
- [x] Stores + hooks + shared components
- [x] Edge Functions scaffolded

### Phase 1.5 — Stabilization (DONE)
- [x] Fix "Não autenticado" (profiles INSERT policy + verify trigger + email config)
- [x] Fix email confirmation (disable in Supabase Dashboard)
- [x] Replace birth date TextInput with DD/MM/YYYY split input
- [x] Add i18n (i18next + locales + language switcher)
- [x] Create settings screen (language + logout)
- [x] Fix Edge Functions: model → Haiku, fix payload mismatch, add CORS
- [x] Test full flow: register → login → add child → setup session

### Phase 2 — Session Engine (DONE)
- [x] Deploy generate-session Edge Function
- [x] Wire session store → edge function → save activities
- [x] Pass i18n language to edge function

### Phase 3 — Child UI (DONE)
- [x] app/(child)/ layout + session player
- [x] Activity renderers: Story, Song, Question, Drawing
- [x] Interactive elements: finger-drawing canvas, tappable question options, pop sound
- [x] Progress dots, fade transitions, celebration screen with stars

### Phase 4 — Reports (DONE)
- [x] Report auto-generated after session completion (background)
- [x] Reports screen with skills, engagement, recommendations
- [x] Report store + hook
- [x] Navigation from parent dashboard

### Phase 5 — Voice (DONE)
- [x] expo-speech TTS in all activities + session greeting
- [x] Microphone recording in QuestionActivity
- [x] Whisper transcription via Edge Function
- [x] Auto-advance stories after speech finishes

### Phase 6 — Polish Pass (CURRENT)
- [ ] Onboarding flow for first-time users
- [ ] Offline handling / error states for network failures
- [ ] Loading skeletons and better loading states
- [ ] Accessibility audit (screen reader labels, contrast ratios)
- [ ] App icon and splash screen design
- [ ] End-to-end testing on physical device

---

## Debugging Checklist

1. Auth session? — `supabase.auth.getSession()` → null = not logged in
2. Profile exists? — `SELECT * FROM profiles WHERE id = '<uid>'` → empty = trigger missing
3. RLS policies? — Table Editor → table → Policies tab
4. Email confirmed? — `auth.users` → `email_confirmed_at` → null + confirmation required = blocked
5. Full error? — `console.log('Error:', JSON.stringify(error))`
6. Edge Function deployed? — Dashboard → Edge Functions
7. API keys? — Dashboard → Edge Functions → Secrets

---

## When Starting a New Task

1. Read this CLAUDE.md
2. We're in Phase 6 — Polish Pass
3. Work through the phase checklist in order
4. Verify changes work end-to-end
5. Read existing files before modifying

---

## Project Info

- Founder: Bruno Diniz (B.C. Diniz)
- Company: Solara Books
- Supabase ref: hxinhsbctuaujnrgjzhw
- GitHub: https://github.com/brunocamparadiniz/kidspark
