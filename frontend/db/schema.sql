-- ============================================================================
-- TeamUp & SocialFinding — Phase 3 Production Database & Geospatial Schema
-- Engine: PostgreSQL 16+ with PostGIS 3.4+ Extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(120) NOT NULL,
    username VARCHAR(64) UNIQUE NOT NULL,
    avatar_url TEXT NOT NULL,
    location_label VARCHAR(160) NOT NULL DEFAULT 'Downtown & Metro Area',
    home_coordinates GEOGRAPHY(Point, 4326),
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

CREATE INDEX IF NOT EXISTS idx_users_home_coordinates
    ON users USING GIST (home_coordinates);

-- 2. USER SPORTS PASSPORT TABLE
CREATE TABLE IF NOT EXISTS user_sports_passport (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_name VARCHAR(64) NOT NULL,
    sport_icon VARCHAR(16) NOT NULL,
    preferred_role VARCHAR(120) NOT NULL,
    skill_tier VARCHAR(64) NOT NULL,
    verifications_label VARCHAR(120) NOT NULL DEFAULT '0 Endorsements',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. USER WEEKLY AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS user_availability (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_code VARCHAR(16) NOT NULL,
    status_label VARCHAR(64) NOT NULL,
    status_type VARCHAR(16) NOT NULL CHECK (status_type IN ('busy', 'preferred', 'primary')),
    UNIQUE (user_id, day_code)
);

-- 4. USER FAIR PLAY BADGES TABLE
CREATE TABLE IF NOT EXISTS badges (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(120) NOT NULL,
    awarded_count INTEGER NOT NULL DEFAULT 1
);

-- 5. VENUES TABLE (Geospatial Indexed)
CREATE TABLE IF NOT EXISTS venues (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    address VARCHAR(255) NOT NULL,
    sport_types TEXT[] NOT NULL DEFAULT '{}',
    coordinates GEOGRAPHY(Point, 4326) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venues_coordinates
    ON venues USING GIST (coordinates);

-- 6. EVENTS / MATCHES TABLE (Geospatial Indexed)
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    sport VARCHAR(64) NOT NULL,
    icon VARCHAR(16) NOT NULL,
    skill VARCHAR(64) NOT NULL,
    venue_id BIGINT REFERENCES venues(id) ON DELETE SET NULL,
    venue_name VARCHAR(160) NOT NULL,
    address VARCHAR(255) NOT NULL,
    coordinates GEOGRAPHY(Point, 4326) NOT NULL,
    date_time_str VARCHAR(120) NOT NULL,
    start_time_iso VARCHAR(64),
    end_time_iso VARCHAR(64),
    cost VARCHAR(64) NOT NULL DEFAULT 'Free',
    confirmed_players INTEGER NOT NULL DEFAULT 1,
    max_players INTEGER NOT NULL CHECK (max_players BETWEEN 2 AND 100),
    host_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    host_name VARCHAR(120) NOT NULL,
    host_karma INTEGER NOT NULL DEFAULT 98,
    host_avatar TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    join_policy VARCHAR(24) NOT NULL DEFAULT 'instant' CHECK (join_policy IN ('instant', 'request')),
    status VARCHAR(24) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FULL', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_coordinates
    ON events USING GIST (coordinates);

-- 7. EVENT PARTICIPANTS & WAITLIST TABLE
CREATE TABLE IF NOT EXISTS event_participants (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    player_name VARCHAR(120) NOT NULL,
    role VARCHAR(64) NOT NULL DEFAULT 'Confirmed',
    karma INTEGER NOT NULL DEFAULT 95,
    rsvp_status VARCHAR(24) NOT NULL DEFAULT 'CONFIRMED' CHECK (rsvp_status IN ('CONFIRMED', 'WAITLISTED', 'LEFT')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, player_name)
);

-- 8. SQUADS / CLUBS TABLE
CREATE TABLE IF NOT EXISTS squads (
    id BIGSERIAL PRIMARY KEY,
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

-- 9. SQUAD MEMBERS TABLE
CREATE TABLE IF NOT EXISTS squad_members (
    id BIGSERIAL PRIMARY KEY,
    squad_id BIGINT NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    member_role VARCHAR(32) NOT NULL DEFAULT 'MEMBER' CHECK (member_role IN ('CAPTAIN', 'MEMBER', 'PENDING')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (squad_id, user_id)
);

-- 10. CHAT CHANNELS & MESSAGES TABLES
CREATE TABLE IF NOT EXISTS chat_channels (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    squad_id BIGINT REFERENCES squads(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL,
    subtitle VARCHAR(255) NOT NULL,
    sport_icon VARCHAR(16) NOT NULL,
    last_message TEXT NOT NULL DEFAULT '',
    last_time VARCHAR(64) NOT NULL DEFAULT 'Just now',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    pinned_at BIGINT,
    pinned_announcement TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    channel_id BIGINT NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    sender_name VARCHAR(120) NOT NULL,
    sender_avatar TEXT NOT NULL,
    time_label VARCHAR(64) NOT NULL,
    message_text TEXT NOT NULL,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    is_self BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. KARMA AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS karma_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
    delta INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- GEOSPATIAL QUERY HELPER FUNCTION (PostGIS ST_DWithin & ST_Distance)
-- Returns events within `radius_km` sorted by true spherical distance.
-- ============================================================================
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
        ROUND((ST_Distance(
            e.coordinates,
            ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
        ) / 1000.0)::numeric, 1)::double precision AS distance_km
    FROM events e
    WHERE ST_DWithin(
        e.coordinates,
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
        radius_km * 1000.0
    )
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;
