# 5. Non-Functional Requirements (NFR)

## 5.1 Performance & Latency
- Page initial load time (LCP) shall be < 1.8 seconds on 4G connections.
- Geo-spatial queries (searching activities within radius) must return in < 250ms for up to 10,000 active nodes.
- Chat message delivery latency must be < 150ms via WebSocket connections.

## 5.2 Scalability
- Horizontal scalability for API gateways and WebSocket connection managers.
- Database spatial indexing utilizing PostgreSQL `PostGIS` / R-Tree indexes.
- Caching layer (Redis) for hot event feeds and user location data.

## 5.3 Security & Privacy
- **Data Protection:** HTTPS/TLS 1.3 in transit; AES-256 for sensitive stored credentials.
- **Location Obfuscation:** The public map should never display an individual player's home address; home locations are snapped to neighborhood centroids or fuzzed with a random 200m offset.
- **Content Moderation:** In-app reporting for harassment, spam, offensive profiles, or abusive chat messages with automated temporary silencing pending human review.
- Compliance with GDPR/CCPA for user data export and deletion ("Right to be Forgotten").

## 5.4 Usability & Accessibility
- **Responsive Web Design:** Fully optimized for mobile screens (viewport 360px+) and desktop viewports (1920px).
- **Accessibility:** Conformance with WCAG 2.1 Level AA standards (color contrast, screen reader aria-labels, full keyboard navigation).
