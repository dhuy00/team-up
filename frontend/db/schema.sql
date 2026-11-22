-- ============================================================================
-- TeamUp & SocialFinding — Production Database & Geospatial Schema
-- Engine: PostgreSQL 16 / 18+ (with uuid-ossp, cube & earthdistance / Haversine)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(120) NOT NULL,
    username VARCHAR(64) UNIQUE NOT NULL,
    avatar_url TEXT NOT NULL,
    location_label VARCHAR(160) NOT NULL DEFAULT 'Downtown & Metro Area',
    home_lat DOUBLE PRECISION NOT NULL DEFAULT 37.7749,
    home_lng DOUBLE PRECISION NOT NULL DEFAULT -122.4194,
    karma_score INTEGER NOT NULL DEFAULT 95 CHECK (karma_score BETWEEN 0 AND 100),
    karma_tier VARCHAR(64) NOT NULL DEFAULT 'Tier 1 • Verified',
    bio TEXT NOT NULL DEFAULT '',
    matches_count INTEGER NOT NULL DEFAULT 0,
    no_shows_count INTEGER NOT NULL DEFAULT 0,
    endorsed_count INTEGER NOT NULL DEFAULT 0,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_coordinates
    ON users (home_lat, home_lng);

-- 2. USER SPORTS PROFILE / PASSPORT TABLE
CREATE TABLE IF NOT EXISTS user_sports_passport (
    id BIGINT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_name VARCHAR(64) NOT NULL,
    sport_icon VARCHAR(16) NOT NULL,
    preferred_role VARCHAR(120) NOT NULL,
    skill_tier VARCHAR(64) NOT NULL,
    verifications_label VARCHAR(120) NOT NULL DEFAULT '0 Endorsements',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id)
);

-- 3. USER WEEKLY AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS user_availability (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_order INTEGER NOT NULL DEFAULT 0,
    day_code VARCHAR(16) NOT NULL,
    status_label VARCHAR(64) NOT NULL,
    status_type VARCHAR(16) NOT NULL CHECK (status_type IN ('busy', 'preferred', 'primary')),
    UNIQUE (user_id, day_code)
);

-- 4. USER FAIR PLAY BADGES TABLE
CREATE TABLE IF NOT EXISTS badges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(120) NOT NULL,
    awarded_count INTEGER NOT NULL DEFAULT 1,
    UNIQUE (user_id, label)
);

-- 5. VENUES TABLE (Geospatial Indexed)
CREATE TABLE IF NOT EXISTS venues (
    id BIGINT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    address VARCHAR(255) NOT NULL,
    sport_types TEXT[] NOT NULL DEFAULT '{}',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    distance_km DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    submitted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venues_lat_lng
    ON venues (lat, lng);

-- 6. EVENTS / MATCHES TABLE (Geospatial Indexed)
CREATE TABLE IF NOT EXISTS events (
    id BIGINT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    sport VARCHAR(64) NOT NULL,
    icon VARCHAR(16) NOT NULL,
    skill VARCHAR(64) NOT NULL,
    venue_id BIGINT REFERENCES venues(id) ON DELETE SET NULL,
    venue_name VARCHAR(160) NOT NULL,
    address VARCHAR(255) NOT NULL DEFAULT '',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    distance_km DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    date_time_str VARCHAR(120) NOT NULL,
    start_time_iso VARCHAR(64),
    end_time_iso VARCHAR(64),
    cost VARCHAR(64) NOT NULL DEFAULT 'Free',
    confirmed_players INTEGER NOT NULL DEFAULT 1,
    max_players INTEGER NOT NULL CHECK (max_players BETWEEN 2 AND 100),
    host_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    host_name VARCHAR(120) NOT NULL,
    host_karma INTEGER NOT NULL DEFAULT 98,
    host_avatar TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    user_joined BOOLEAN NOT NULL DEFAULT FALSE,
    is_user_host BOOLEAN NOT NULL DEFAULT FALSE,
    min_karma_required INTEGER,
    completed_check_in BOOLEAN NOT NULL DEFAULT FALSE,
    join_policy VARCHAR(24) NOT NULL DEFAULT 'instant' CHECK (join_policy IN ('instant', 'request')),
    status VARCHAR(24) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FULL', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_lat_lng
    ON events (lat, lng);

-- 7. EVENT PARTICIPANTS & WAITLIST TABLE
CREATE TABLE IF NOT EXISTS event_participants (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    player_name VARCHAR(120) NOT NULL,
    role VARCHAR(64) NOT NULL DEFAULT 'Confirmed',
    karma INTEGER NOT NULL DEFAULT 95,
    attendance VARCHAR(24),
    rsvp_status VARCHAR(24) NOT NULL DEFAULT 'CONFIRMED' CHECK (rsvp_status IN ('CONFIRMED', 'WAITLISTED', 'LEFT')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, player_name)
);

-- 8. SQUADS / CLUBS TABLE
CREATE TABLE IF NOT EXISTS squads (
    id BIGINT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    sport VARCHAR(64) NOT NULL,
    abbr VARCHAR(8) NOT NULL,
    variant VARCHAR(16) NOT NULL DEFAULT 'white',
    member_count INTEGER NOT NULL DEFAULT 1,
    max_members INTEGER NOT NULL CHECK (max_members BETWEEN 2 AND 500),
    description TEXT NOT NULL DEFAULT '',
    captain_name VARCHAR(120) NOT NULL,
    home_venue VARCHAR(160) NOT NULL,
    stat_label VARCHAR(64) NOT NULL DEFAULT 'Reliability Avg',
    stat_value VARCHAR(64) NOT NULL DEFAULT '96% Karma',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SQUAD MEMBERS & INVITE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS squad_members (
    id BIGSERIAL PRIMARY KEY,
    squad_id BIGINT NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    member_role VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (member_role IN ('CAPTAIN', 'MEMBER', 'PENDING')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (squad_id, user_id)
);

-- 10. CHAT CHANNELS & MESSAGES TABLES
CREATE TABLE IF NOT EXISTS chat_channels (
    id BIGINT PRIMARY KEY,
    event_id BIGINT,
    squad_id BIGINT,
    title VARCHAR(180) NOT NULL,
    subtitle VARCHAR(255) NOT NULL,
    sport_icon VARCHAR(16) NOT NULL,
    last_message TEXT NOT NULL DEFAULT '',
    last_time VARCHAR(64) NOT NULL DEFAULT 'Just now',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    pinned_at BIGINT,
    pinned_announcement TEXT,
    pinned_items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT NOT NULL,
    channel_id BIGINT NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    sender_name VARCHAR(120) NOT NULL,
    sender_avatar TEXT NOT NULL,
    time_label VARCHAR(64) NOT NULL,
    message_text TEXT NOT NULL,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    is_self BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (channel_id, id)
);

-- 11. KARMA AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS karma_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
    delta INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- GEOSPATIAL HAVERSINE DISTANCE FUNCTION (Pure SQL, works on any PostgreSQL)
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DOUBLE PRECISION,
    lng1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    r CONSTANT DOUBLE PRECISION := 6371.0;
    dlat DOUBLE PRECISION;
    dlng DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    IF lat1 = lat2 AND lng1 = lng2 THEN
        RETURN 0.0;
    END IF;
    dlat := RADIANS(lat2 - lat1);
    dlng := RADIANS(lng2 - lng1);
    a := SIN(dlat / 2.0) * SIN(dlat / 2.0) +
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
         SIN(dlng / 2.0) * SIN(dlng / 2.0);
    c := 2.0 * ATAN2(SQRT(a), SQRT(1.0 - a));
    RETURN ROUND((r * c)::numeric, 1)::double precision;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION find_events_within_radius(
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION
)
RETURNS TABLE (
    event_id BIGINT,
    title VARCHAR,
    sport VARCHAR,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id AS event_id,
        e.title,
        e.sport,
        calculate_distance_km(center_lat, center_lng, e.lat, e.lng) AS distance_km
    FROM events e
    WHERE calculate_distance_km(center_lat, center_lng, e.lat, e.lng) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;
