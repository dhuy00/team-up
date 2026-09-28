# 4. Functional Requirements

## 4.1 Module 1: User Identity, Profiles & Preferences

### FR-1.1: Authentication & Authorization
- Users shall be able to register and sign in using Email/Password, Google OAuth
- Secure session management with JWT (Access + Refresh tokens).
- Role-based permissions: Guest (unauthenticated), Registered User, Team Admin/Host, Platform Moderator.

### FR-1.2: Player Profile & Sports Passport
- **Basic Info:** Display name, handle (`@username`), avatar, bio, age bracket, and primary city/neighborhood.
- **Activity & Sports Portfolio:**
  - Add sports/activities (e.g., Football, Tennis, Hiking, D&D, Chess, Volleyball).
  - Self-assessed skill rating per activity: *Beginner*, *Intermediate*, *Advanced*, *Competitive*.
  - Preferred playing positions / roles (e.g., Goalkeeper, Point Guard, Support).
- **Availability Matrix:** Weekly recurring availability slots (e.g., Weekday evenings, Saturday mornings).
- **Privacy & Safety Settings:** Option to hide exact address (display fuzzy radius only), toggle profile discoverability.

---

## 4.2 Module 2: Activity & Team Creation

### FR-2.1: Event / Match Creation Wizard
Event organizers can create an activity posting with the following parameters:
- **Activity Category & Subtype:** Sport, gaming, outdoor, fitness, hobby.
- **Game Format:** Pickup game, structured match, tournament, training session, or casual hangout.
- **Location:**
  - Physical venue with map pinpointing (coordinates, address, parking notes, indoor/outdoor indicator).
  - Virtual/Online (for esports/online games with voice server link).
- **Date, Time & Duration:** Single occurrence or recurring schedule (e.g., every Tuesday at 7:00 PM).
- **Capacity Controls:**
  - Minimum players required (threshold for event confirmation).
  - Maximum player capacity.
  - Automated waitlist (promotes waitlisted users when someone drops out).
- **Access Model:**
  - *Public (Instant Join):* Anyone matching skill criteria can RSVP.
  - *Request to Join (Approval Required):* Host reviews applicants before acceptance.
  - *Private (Invite Only):* Accessible only via direct link or team invite.
- **Cost Sharing:** Optional fee per player (e.g., court fee splitting) with payment instructions.

### FR-2.2: Persistent Teams & Clubs
- Users can create persistent "Teams" or "Clubs" (e.g., "North District FC").
- Team roster with member roles: Owner/Captain, Co-Captain, Regular Member, Guest/Sub.
- Team schedule showing upcoming fixtures and team-internal matches.
- Team statistics (games played, win/loss record if competitive).

---

## 4.3 Module 3: Discovery & Matchmaking ("Social Finding")

### FR-3.1: Geospatial & Filtered Search
- **Interactive Map View:** Visual cluster pins of upcoming activities nearby.
- **Feed / List View:** Chronological or proximity-sorted cards with clear status tags (`3 spots left`, `Waitlist only`, `Skill: Intermediate`).
- **Filter Parameters:**
  - Activity / Sport type.
  - Distance radius (e.g., within 2 km, 5 km, 15 km, 50 km).
  - Date range & time of day.
  - Skill level match.
  - Cost (Free vs Paid).
  - Gender preference (All, Co-ed, Men-only, Women-only).

### FR-3.2: "Find a Team / Find a Player" Matchmaking Feed
- Dedicated "Free Agent" board where solo players broadcast their availability for teams needing ringers/substitutes.
- "Emergency Sub" instant alerts: Captains can broadcast a distress call (e.g., "Need 1 player in 2 hours near Central Park") notifying nearby users who opted into urgent invites.

---

## 4.4 Module 4: Real-Time Communication

### FR-4.1: Activity Group Chat
- Every event automatically provisions a dedicated group chat upon creation.
- Chat lifecycle:
  - Accessible to confirmed participants and host.
  - Pinned announcement feature for host updates (e.g., "Court moved to Court 3").
  - Quick polling widget (e.g., voting on jersey color or venue).
  - Automatic system messages for join/leave events.

### FR-4.2: Direct Messaging (1-to-1)
- Private messaging between users to discuss team invites or coordinate ride-shares.
- Anti-spam safeguard: Non-friends can only send an initial message request; recipient must accept before continuous conversation.

### FR-4.3: Notifications System
- Multi-channel delivery: In-app notification center, web push notifications, and email digests.
- Event reminders: 24-hour and 2-hour pre-game reminders.
- Roster updates: Notifications when promoted from waitlist to active roster.

---

## 4.5 Module 5: Attendance Reliability & Fair Play ("Karma Score")

### FR-5.1: Check-In & Attendance Verification
- Post-game check-in by host or QR-code based self check-in at the venue.
- Statuses: *Attended*, *Excused Absence* (canceled >12 hrs before), *Late Cancellation*, *No-Show (Ghost)*.

### FR-5.2: Reliability Rating
- Each user displays an "Attendance Reliability" percentage (e.g., "96% Reliability Rate over 25 games").
- Repeated unexcused no-shows temporarily restrict instant RSVP privileges (requiring host manual approval).
- Endorsements: Peer badges for positive sportsmanship (e.g., "Punctual", "Team Player", "Great Sport").
