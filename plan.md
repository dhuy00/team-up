# TeamUp — Product & Engineering Roadmap (`plan.md`)

**TeamUp** is a Social Finding & Activity Team-Up Platform designed to help players discover local pickup games, form recurring clubs/squads, coordinate in real-time match rooms, and build verifiable athletic reputation through a **Sports Passport & Reliability Karma** system.

---

## Current Architecture Snapshot

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- **Core Modules Implemented (Frontend Prototype):**
  - **Explore & Radar (`components/explore/`):** Hero quick-filter, unified sport/distance/skill filter bar, interactive Leaflet map radar (`RadarMapCanvas`, `RadarControls`, `RadarVenuesList`), `EventCard` grid, `EventDetailModal`, and `CreateEventModal` wizard.
  - **Clubs & Squads (`components/squads/`):** `SquadsSection` and `SquadCard` with invite request toggles.
  - **Match & Squad Chats (`components/chat/`):** `ChatSection` with channel list, pinned host announcements, and message composer.
  - **Sports Passport (`components/passport/`):** `PassportSection` with Reliability Karma score, fair-play badges, skill matrix, and weekly availability schedule.
  - **Cross-Cutting (`hooks/`, `lib/`, `services/`):** Multi-language support (`en` / `vi`), theme switching (`next-themes`), Haversine geolocation (`lib/geo.ts`), and Nominatim geocoding (`services/geocoding.ts`).

---

## Phase 1: Frontend Foundation, Modularity & UX Polish (Current Phase)

**Objective:** Complete a cohesive, modular, fully localized, and responsive frontend experience with rich client-side state before introducing backend persistence.

### What to Do
1. **Component Modularization & Clean Architecture:**
   - Maintain single-responsibility components across `explore/`, `radar/`, `squads/`, `chat/`, and `passport/` (completed for `EventCard`, `ExploreFilterBar`, `SquadCard`, and `radar/*` subcomponents).
   - Extract remaining inline sub-views in `ChatSection` (e.g., `ChannelSidebar`, `ChatMessageList`, `ChatComposer`) and `PassportSection` (e.g., `KarmaIdentityCard`, `SportSkillMatrix`, `WeeklyAvailabilityGrid`).
2. **Complete Feature Flows in UI:**
   - **Clubs & Squads:** Build a dedicated `CreateSquadModal` and `SquadDetailModal` (currently `onOpenCreateSquad` opens the event modal). Add sport/skill filtering and search for squads.
   - **Sports Passport:** Allow editing profile bio, toggling weekly availability slots interactively, and deleting/editing existing sports in the skill matrix.
   - **Chat Integration:** Connect "Join Game" / "Open Match Chat" in `EventDetailModal` so joining an event automatically creates or navigates to that event's chat channel in `ChatSection`.
3. **Full Localization (`en` & `vi`) & Accessibility:**
   - Audit `ChatSection` and remaining hardcoded strings so 100% of UI copy uses `useTranslation()`.
   - Add keyboard navigation (`Escape` to close modals, focus trapping, ARIA roles for tabs and custom selects).
4. **Client State Persistence:**
   - Persist user-created events, joined rosters, squad invite states, chat messages, and passport edits in `localStorage` (or Zustand with persist middleware) so state survives page refreshes during demos.

### What to Achieve (Deliverables & Exit Criteria)
- [x] Modularized Radar, Explore, Squad, Chat, and Passport components with shared utilities.
- [x] Dedicated Squad creation & detail modals independent of the Event creation flow.
- [x] Seamless end-to-end user journey: *Search on Radar -> Join Match -> Redirect to Match Chat -> View Host/Player Passport*.
- [x] 100% translation coverage across English and Vietnamese (`locales/en.ts` and `locales/vi.ts`) with zero hardcoded UI strings.
- [x] Zero TypeScript errors (`npm run build`) and zero ESLint warnings (`npm run lint`).

---

## Phase 2: URL Routing, State Management & Data Layer Abstraction

**Objective:** Transition from single-page tab state (`activeTab` in `app/page.tsx`) to real shareable Next.js App Router URLs and a clean service/repository layer ready for API integration.

### What to Do
1. **Next.js App Router Migration:**
   - Convert virtual tabs into dedicated routes under `app/`:
     - `/` or `/explore` — Explore & Live Radar (`?sport=Soccer&radius=10&eventId=1`)
     - `/squads` and `/squads/[id]` — Clubs & Squads directory and detail pages
     - `/chats` and `/chats/[channelId]` — Match & Direct messaging rooms
     - `/passport` and `/passport/[username]` — Personal & public player Sports Passports
2. **URL-Driven Filter & Modal State:**
   - Sync sport, skill, distance radius, and map center coordinates with URL search params so users can bookmark or share filtered views and specific match links.
3. **Data Fetching & Client Store Layer:**
   - Introduce a typed service layer (`services/events.ts`, `services/squads.ts`, `services/chats.ts`, `services/passport.ts`) with async interfaces.
   - Adopt TanStack Query (React Query) or SWR for caching, optimistic updates (joining/leaving matches, sending messages), and loading/error skeleton states.

### What to Achieve (Deliverables & Exit Criteria)
- [x] Direct deep-linking to any match, squad, chat room, or player profile via URL.
- [x] Browser Back/Forward buttons work naturally across all sections and modals.
- [x] UI components consume data exclusively through custom hooks (`useEvents`, `useSquads`, `useChats`, `usePassport`) backed by a unified API client interface.
- [x] Loading skeletons and empty/error states implemented for every feed and modal.

---

## Phase 3: Backend API, Authentication & Geospatial Database

**Objective:** Replace mock data with a production database, user authentication, and geospatial queries for nearby games, venues, and players.

### What to Do
1. **Database & Geospatial Schema Design (PostgreSQL + PostGIS / Supabase or Prisma):**
   - Core tables: `users`, `user_sports_passport`, `user_availability`, `venues`, `events`, `event_participants`, `squads`, `squad_members`, `karma_logs`, `badges`.
   - Index coordinates (`GEOGRAPHY(Point, 4326)`) on `events`, `venues`, and active `nearby_players` for fast radius queries (`ST_DWithin`).
2. **Authentication & Onboarding:**
   - Implement Auth (OAuth with Google/Apple + Email OTP/Magic Link).
   - Build a first-time Onboarding Wizard: set home location, pick top sports, self-assess skill tiers, and configure weekly availability.
3. **REST / RPC API Endpoints:**
   - **Events API:** CRUD for hosting games, geospatial radius filtering, instant join vs. host-approval request workflows, waitlist handling when `confirmedPlayers === maxPlayers`.
   - **Venues API:** Curated & community-submitted sports venues linked to events on the Radar.
   - **Squads API:** Create squads, manage rosters, assign captains, request/approve invites, and schedule recurring squad events.

### What to Achieve (Deliverables & Exit Criteria)
- [ ] Real user sign-up, login, session management, and protected actions (hosting, joining, chatting).
- [ ] Server-side geospatial queries returning events and venues sorted by true distance within `X` km.
- [ ] Concurrency-safe roster management (preventing overbooking when two players claim the last spot simultaneously, plus automatic waitlist promotion).
- [ ] Persistent player profiles and customizable Sports Passports stored in PostgreSQL.

---

## Phase 4: Real-Time Match Rooms, Notifications & Live Player Radar

**Objective:** Enable live communication and real-time presence so players can coordinate last-minute game changes and spot active players nearby.

### What to Do
1. **Real-Time Chat Engine (WebSockets / Supabase Realtime / Socket.io):**
   - Live message delivery, typing indicators, read receipts, and online presence badges in Match Channels, Squad Channels, and Direct Messages.
   - Host moderation tools: pin/unpin announcements, remove disruptive participants, and broadcast urgent match updates (e.g., court change or rain delay).
2. **Live "Looking for Game" (LFG) Player Radar:**
   - Allow users to broadcast a temporary live status on the Radar (e.g., *"Ready for badminton doubles for the next 2 hours"*) with privacy-safe fuzzy coordinates (`latOffset`/`lngOffset` obfuscation).
   - Enable 1-click "Invite to Match" or "Ping to Play" from a player marker on the Leaflet map.
3. **Notification System:**
   - In-app notification center (bell icon in `Navigation`) + Web Push / Email notifications for:
     - Join request approved/declined
     - Waitlist spot opened up
     - Upcoming match reminder (2 hours before kickoff)
     - Host pinned announcement or @mention

### What to Achieve (Deliverables & Exit Criteria)
- [ ] Sub-second real-time message delivery in `ChatSection` without polling.
- [ ] Functional opt-in LFG broadcast on the Radar map with automatic expiration and location privacy fuzzing.
- [ ] Real-time roster counter updates on `EventCard` and `RadarMapCanvas` popups as players join or leave.
- [ ] Working in-app notification feed with unread badges and push notification opt-in.

---

## Phase 5: Reliability Karma Engine, Post-Match Verification & Fair Play

**Objective:** Solve the #1 problem in pickup sports—**no-shows and skill mismatches**—by automating the Reliability Karma and peer endorsement lifecycle.

### What to Do
1. **Post-Match Attendance & Karma Calculation:**
   - Automatically transition events to `COMPLETED` after the scheduled end time.
   - Prompt the Host (and participants) with a 30-second Post-Match Check-In:
     - Mark attendance (`Showed Up`, `Late`, `No-Show`).
     - Automatic Karma adjustments: e.g., `+1` Karma for punctual attendance, `-10` for unexcused no-show, `-3` for late cancellation (< 3 hours before start).
2. **Peer Endorsements & Skill Verification:**
   - Allow co-players to award Fair-Play Badges (`⏱️ Always Punctual`, `🤝 Team First`, `🌟 Great Sport`) after a match.
   - Allow Captains/Hosts to verify a player's self-assessed skill tier on their Sports Passport (e.g., *"6 Captain verifications for Intermediate Soccer"*).
3. **Karma-Gated Match Policies:**
   - Enable hosts to set minimum Reliability Karma thresholds (e.g., `90%+ Karma required for Instant Join`; lower Karma defaults to `Request to Join`).

### What to Achieve (Deliverables & Exit Criteria)
- [ ] Automated post-match check-in and review flow triggered after each game.
- [ ] Auditable Karma score calculation that dynamically updates player tiers (`Tier 1`, `Verified`, `Probation`) and restricts chronic no-shows.
- [ ] Peer-verified skill badges and captain endorsements reflected live on each user's `PassportSection`.

---

## Phase 6: Testing, Performance, PWA & Production Launch

**Objective:** Harden the platform for mobile users on the go, ensure high reliability, and deploy to production with monitoring.

### What to Do
1. **Progressive Web App (PWA) & Mobile Optimization:**
   - Configure `manifest.json`, service workers, and installable mobile home-screen support.
   - Optimize touch gestures for the Leaflet Radar drawer, bottom sheets for mobile filters, and safe-area insets for mobile chat input.
2. **Automated Testing Suite:**
   - **Unit Tests (Vitest):** Haversine distance calculations (`lib/geo.ts`), filter logic, Karma scoring rules, and date/time formatting.
   - **Component & Integration Tests (React Testing Library):** `CreateEventModal` validation, `ExploreFilterBar` state sync, and `EventDetailModal` join flows.
   - **End-to-End Tests (Playwright):** Critical user journeys (Sign up -> Filter Radar -> Host Game -> Join Game -> Send Chat -> Complete Match Check-In).
3. **Performance, Security & Observability:**
   - Rate-limit geocoding and API endpoints; add input validation with `zod`.
   - Optimize map marker clustering (`Leaflet.markercluster`) for dense metropolitan areas with 100+ concurrent games.
   - Set up error tracking (Sentry), analytics (PostHog), and CI/CD pipelines (GitHub Actions + Vercel).

### What to Achieve (Deliverables & Exit Criteria)
- [ ] Lighthouse score >= 90 across Performance, Accessibility, and Best Practices on both Desktop and Mobile.
- [ ] Installable PWA with smooth 60fps map clustering even with 500+ markers.
- [ ] Automated CI pipeline running TypeScript, ESLint, Vitest, and Playwright E2E checks on every pull request.
- [ ] Production deployment live with automated database backups and real-time error alerting.
