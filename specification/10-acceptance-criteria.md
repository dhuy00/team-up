# 10. Acceptance Criteria (User Story Samples)

## US-01: Joining a Pickup Match
- **Given** an authenticated user viewing an active public event with 9/10 spots filled,
- **When** the user clicks "Join Match",
- **Then** their status changes to "Confirmed", the spot count updates to 10/10 in real-time, the user is automatically added to the event group chat, and a calendar invite (`.ics`) is made available.

## US-02: Waitlist Promotion
- **Given** an event at full capacity with 2 players on the waitlist,
- **When** an active participant changes their RSVP to "Not Attending",
- **Then** the first user on the waitlist is automatically promoted to "Confirmed", notified via push/email, and the host's roster view updates instantly.
