# CLAUDE.md — KidSpark
> Read this entire file before doing anything.
> Leia este arquivo inteiro antes de qualquer tarefa.

---

## What is KidSpark

**KidSpark** is an educational mobile app for children aged 2–5.
A parent sets up a session in seconds; the AI creates and leads interactive activities adapted to available time, the child's mood, and learning goals. At the end, the parent receives a development report.

**Problem it solves:** parents need time, kids will use screens anyway — this app makes screen time intentional, educational, and guilt-free.

**Language:** The app must support Portuguese (pt-BR) and English (en). All user-facing strings must go through the i18n system (not yet implemented — see Phase 1.5). Default language: Portuguese.

---

## Current State (March 2026)

### What's working
- Expo project initialized with TypeScript + Expo Router (file-based routing)
- Supabase client connected (auth + database) with AsyncStorage persistence
- Login and registration screens — user can sign up and sign in
- Parent dashboard with child list, child creation form, and session setup link
- Setup session screen with duration/mood/goals selectors
- Zustand stores for auth, child, and session state
- Supabase Edge Functions scaffolded (generate-session, generate-report, transcribe-voice)
- SQL migration with tables, RLS policies, and profile trigger
- Path aliases (@/) configured in tsconfig
- Shared UI components (Button, Card, Input)

### Known Bugs — Fix These First

1. **"Não autenticado" when adding a child**
   - Location: `stores/child.store.ts` line 49 and `stores/session.store.ts` line 22
   - Both use `supabase.auth.getUser()` which makes a network call to Supabase auth server
   - Root cause is likely one of:
     - (a) The `profiles` table has no INSERT policy — the migration only has SELECT and UPDATE policies. If the signup trigger fails silently, the profile row doesn't exist, and subsequent RLS checks that join on profiles may fail.
     - (b) Email confirmation is required in Supabase but the redirect URL is misconfigured, so the user signs up but their email is never confirmed, meaning getUser() works but RLS treats them as unverified.
   - Fix: Add a profile INSERT policy. Verify the trigger exists. Check if email confirmation is disabled or redirect URL is correct.

2. **Email confirmation link broken** — opens "this site can't be reached"
   - Supabase sends a confirmation link with the redirect URL from Dashboard > Authentication > URL Configuration
   - Must be set to `kidspark://` (the scheme in app.json) for production, or `exp://192.168.x.x:8081` for local dev
   - Quick fix: Disable email confirmation: Supabase Dashboard > Authentication > Providers > Email > turn off "Confirm email"

3. **Birth date input is a raw text field** — expects YYYY-MM-DD typed manually
   - Location: `app/(parent)/index.tsx` lines 159–167
   - Replace with a proper date picker using `@react-native-community/datetimepicker` or a custom wheel/calendar picker
   - Display format: DD/MM/YYYY (pt-BR) or MM/DD/YYYY (en)
   - Default the picker to ~3 years ago (not today), since target age is 2–5

### Issues in Edge Functions

- `generate-session/index.ts` uses `model: 'claude-opus-4-6'` — change to `'claude-haiku-4-5-20251001'` to keep costs low
- `generate-report/index.ts` also uses `'claude-opus-4-6'` — same fix
- The `generate-session` edge function expects `{ config, childName }` but `session.store.ts` sends `{ sessionId, config }` — out of sync
- No CORS headers on edge function responses

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
| i18n | i18next + react-i18next | NOT YET INSTALLED |
| Styling | React Native StyleSheet | Used throughout (NativeWind planned but NOT installed) |

Note: NativeWind was in the original plan but is NOT installed. The app uses React Native StyleSheet with a custom theme system (constants/themes.ts). Either install NativeWind now or continue with StyleSheet — don't mix.

---

## Folder Structure (actual)

```
kidspark/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx         # Stack, no header
│   │   ├── login.tsx           # Email + password login
│   │   └── register.tsx        # Name + email + password signup
│   ├── (parent)/
│   │   ├── _layout.tsx         # Stack, no header
│   │   ├── index.tsx           # Dashboard: children list, add child form, session link
│   │   └── setup-session.tsx   # Duration, mood, goals selectors → creates session
│   ├── _layout.tsx             # Root: initializes auth, loading spinner
│   └── index.tsx               # Redirect: authenticated → (parent), else → (auth)/login
├── components/shared/
│   ├── Button.tsx              # primary/secondary/outline, sm/md/lg
│   ├── Card.tsx                # Simple card wrapper
│   └── Input.tsx               # Labeled text input
├── constants/
│   ├── activity-types.ts       # ACTIVITY_TYPES, DURATION_OPTIONS, MOOD_OPTIONS, GOAL_OPTIONS
│   └── themes.ts               # Colors (parent + child), Spacing, FontSizes, BorderRadius
├── hooks/
│   ├── useAuth.ts              # Wraps auth store
│   ├── useChildProfile.ts      # Fetches children on auth, wraps child store
│   └── useSession.ts           # Wraps session store
├── lib/
│   └── supabase.ts             # Supabase client with AsyncStorage
├── stores/
│   ├── auth.store.ts           # User, profile, signIn/signUp/signOut, onAuthStateChange
│   ├── child.store.ts          # Children list, addChild, selectChild
│   └── session.store.ts        # Create session → call edge function → save activities
├── supabase/
│   ├── functions/
│   │   ├── generate-session/index.ts
│   │   ├── generate-report/index.ts
│   │   └── transcribe-voice/index.ts
│   └── migrations/
│       └── 001_initial_schema.sql
├── types/index.ts              # Profile, Child, Session, Activity, DevelopmentReport
├── app.json                    # scheme: "kidspark"
├── package.json
├── tsconfig.json               # strict, paths: @/ → ./
└── CLAUDE.md
```

### Files that DON'T exist yet
- `app/(child)/` — child session UI (Phase 3)
- `app/(parent)/reports.tsx` — reports screen (Phase 4)
- `app/(parent)/settings.tsx` — settings + language switch (Phase 1.5)
- `lib/i18n.ts` + `locales/` — i18n system (Phase 1.5)
- `lib/session-engine.ts` — session orchestration (Phase 2)

---

## Database (Supabase / Postgres)

### Tables (from 001_initial_schema.sql)

profiles, children, sessions, session_activities, development_reports — all with RLS enabled.

### MISSING: profiles INSERT policy

The migration only has SELECT + UPDATE for profiles. Add:

```sql
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Profile creation trigger

The migration includes `handle_new_user()` that auto-creates a profile on signup (SECURITY DEFINER). Verify it exists:

```sql
SELECT * FROM profiles;
```

If empty after signup, re-run the trigger SQL in Supabase SQL Editor.

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

## i18n Strategy (Phase 1.5 — not yet implemented)

Install: `npm install i18next react-i18next expo-localization`

```typescript
// lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import ptBR from '@/locales/pt-BR.json';
import en from '@/locales/en.json';

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    en: { translation: en },
  },
  lng: Localization.locale.startsWith('pt') ? 'pt-BR' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
```

All user-facing strings use t():
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
// t('parent.dashboard.title'), t('auth.login.button')
```

---

## Session Engine Flow

```
Parent configures session (setup-session.tsx)
      ↓
session.store.ts creates session row in Supabase
      ↓
session.store.ts calls Edge Function (generate-session)
      ↓
Edge Function calls Claude Haiku with structured prompt
      ↓
Claude returns activity list as JSON
      ↓
session.store.ts saves activities to session_activities table
      ↓
Child UI renders activities one by one (Phase 3)
      ↓
Engagement measured by interaction time (Phase 3)
      ↓
generate-report Edge Function creates dev report (Phase 4)
```

### Prompt template

```typescript
const SESSION_SYSTEM_PROMPT = `
You are an expert educator in child development for ages 2–5.
Create interactive, playful learning sessions.

Rules:
- Always return valid JSON, no markdown, no extra text
- Each activity: 2–5 minutes
- Simple language, short sentences, positivity
- Vary activity types for engagement
- Adapt to mood (energetic = structure, sleepy = calm)
- Respond in the language specified in "language" field
`;
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
- i18n: once implemented, all strings via t()
- Supabase: always destructure { data, error } and handle both

---

## UX / Design

### Parent Panel
- White bg (#FFFFFF), dark primary (#1A1A2E), warm accent (#E8874A), surface (#F5F5F7)
- Rounded corners (8–16px), spacing multiples of 8

### Child Mode (Phase 3)
- Full screen, bright colors: coral (#FF6B6B), teal (#4ECDC4), yellow (#FFE66D)
- Large touch targets (44x44 min), no text — icons/voice only

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

### Phase 1.5 — Stabilization (CURRENT)
- [ ] Fix "Não autenticado" (profiles INSERT policy + verify trigger + email config)
- [ ] Fix email confirmation (disable or fix redirect)
- [ ] Replace birth date TextInput with proper date picker
- [ ] Add i18n (i18next + locales + language switcher)
- [ ] Create settings screen (language + logout)
- [ ] Fix Edge Functions: model → Haiku, fix payload mismatch, add CORS
- [ ] Test full flow: register → login → add child → setup session

### Phase 2 — Session Engine
- [ ] Deploy generate-session Edge Function
- [ ] Wire session store → edge function → save activities
- [ ] Session player screen (basic)

### Phase 3 — Child UI
- [ ] app/(child)/ screens
- [ ] Activity renderers per type
- [ ] Engagement measurement + animations

### Phase 4 — Reports
- [ ] Deploy generate-report Edge Function
- [ ] Reports screen

### Phase 5 — Voice
- [ ] Deploy transcribe-voice Edge Function
- [ ] Microphone + voice activities

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
2. We're in Phase 1.5 — Stabilization
3. Work through the phase checklist in order
4. Verify changes work end-to-end
5. Don't skip phases
6. Read existing files before modifying

---

## Project Info

- Founder: Bruno Diniz (B.C. Diniz)
- Company: Solara Books
- Supabase ref: hxinhsbctuaujnrgjzhw
- GitHub: https://github.com/brunocamparadiniz/kidspark
