import { Pool } from "pg";
import type {
  AttendanceStatus,
  ChatChannel,
  ChatMessage,
  EventActivity,
  PinnedChatMessage,
  RosterPlayer,
  SportPassportItem,
  TeamSquad,
  UserProfile,
} from "../types/models";
import type {
  AuthUserAccount,
  DatabaseState,
  SportsVenueRecord,
} from "./store";

const DEFAULT_DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://dhuy:123@localhost:5432/teamup";

const globalForPg = globalThis as unknown as {
  __teamupPgPool?: Pool;
  __teamupPgInitPromise?: Promise<boolean>;
};

export function getPgPool(): Pool {
  if (!globalForPg.__teamupPgPool) {
    globalForPg.__teamupPgPool = new Pool({
      connectionString: DEFAULT_DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 3_000,
    });
  }
  return globalForPg.__teamupPgPool;
}

/**
 * Checks if PostgreSQL is reachable and returns version + table counts.
 */
export async function pgCheckConnection(): Promise<{
  connected: boolean;
  database?: string;
  version?: string;
  counts?: Record<string, number>;
  error?: string;
}> {
  try {
    const pool = getPgPool();
    const infoRes = await pool.query<{ db: string; ver: string }>(
      "SELECT current_database() AS db, version() AS ver"
    );
    const countsRes = await pool.query<{
      users: string;
      events: string;
      venues: string;
      squads: string;
      chat_channels: string;
      chat_messages: string;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM events) AS events,
        (SELECT COUNT(*) FROM venues) AS venues,
        (SELECT COUNT(*) FROM squads) AS squads,
        (SELECT COUNT(*) FROM chat_channels) AS chat_channels,
        (SELECT COUNT(*) FROM chat_messages) AS chat_messages
    `);
    const row = countsRes.rows[0];
    return {
      connected: true,
      database: infoRes.rows[0]?.db,
      version: infoRes.rows[0]?.ver,
      counts: {
        users: Number(row?.users || 0),
        events: Number(row?.events || 0),
        venues: Number(row?.venues || 0),
        squads: Number(row?.squads || 0),
        chatChannels: Number(row?.chat_channels || 0),
        chatMessages: Number(row?.chat_messages || 0),
      },
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : "Database connection failed",
    };
  }
}

/**
 * Upserts a complete AuthUserAccount (including profile, sports, availability, badges) into PostgreSQL.
 */
export async function pgUpsertUser(user: AuthUserAccount): Promise<void> {
  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
      INSERT INTO users (
        id, email, password_hash, name, username, avatar_url,
        location_label, karma_score, karma_tier, bio,
        matches_count, no_shows_count, endorsed_count, onboarding_completed, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        location_label = EXCLUDED.location_label,
        karma_score = EXCLUDED.karma_score,
        karma_tier = EXCLUDED.karma_tier,
        bio = EXCLUDED.bio,
        matches_count = EXCLUDED.matches_count,
        no_shows_count = EXCLUDED.no_shows_count,
        endorsed_count = EXCLUDED.endorsed_count,
        onboarding_completed = EXCLUDED.onboarding_completed,
        updated_at = NOW()
      `,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.profile.name,
        user.profile.username,
        user.profile.avatar,
        user.profile.location,
        Math.max(0, Math.min(100, user.profile.karma)),
        user.profile.tier,
        user.profile.bio,
        user.profile.matchesCount,
        user.profile.noShowsCount,
        user.profile.endorsedCount,
        user.onboardingCompleted,
      ]
    );

    // Replace user sports
    await client.query("DELETE FROM user_sports_passport WHERE user_id = $1", [
      user.id,
    ]);
    for (const s of user.profile.sports) {
      await client.query(
        `
        INSERT INTO user_sports_passport (
          id, user_id, sport_name, sport_icon, preferred_role, skill_tier, verifications_label
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          s.id,
          user.id,
          s.name,
          s.icon,
          s.role,
          s.skillTier,
          s.verifications,
        ]
      );
    }

    // Replace user availability
    await client.query("DELETE FROM user_availability WHERE user_id = $1", [
      user.id,
    ]);
    for (let i = 0; i < user.profile.availability.length; i++) {
      const slot = user.profile.availability[i];
      await client.query(
        `
        INSERT INTO user_availability (
          user_id, day_order, day_code, status_label, status_type
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [user.id, i, slot.day, slot.status, slot.statusType]
      );
    }

    // Replace user badges
    await client.query("DELETE FROM badges WHERE user_id = $1", [user.id]);
    for (const b of user.profile.badges) {
      await client.query(
        `
        INSERT INTO badges (user_id, label, awarded_count)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, label) DO UPDATE SET awarded_count = EXCLUDED.awarded_count
        `,
        [user.id, b.label, b.count]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Upserts a Venue record into PostgreSQL.
 */
export async function pgUpsertVenue(venue: SportsVenueRecord): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `
    INSERT INTO venues (id, name, address, sport_types, lat, lng, distance_km, is_verified)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      address = EXCLUDED.address,
      sport_types = EXCLUDED.sport_types,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      distance_km = EXCLUDED.distance_km,
      is_verified = EXCLUDED.is_verified
    `,
    [
      venue.id,
      venue.name,
      venue.address,
      venue.sports,
      venue.lat,
      venue.lng,
      venue.distanceKm,
      venue.verified,
    ]
  );
}

/**
 * Upserts an EventActivity and its roster participants into PostgreSQL.
 */
export async function pgUpsertEvent(event: EventActivity): Promise<void> {
  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
      INSERT INTO events (
        id, title, sport, icon, skill, venue_name, address, lat, lng, distance_km,
        date_time_str, start_time_iso, end_time_iso, cost, confirmed_players, max_players,
        host_name, host_karma, host_avatar, notes, user_joined, is_user_host,
        min_karma_required, completed_check_in
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        sport = EXCLUDED.sport,
        icon = EXCLUDED.icon,
        skill = EXCLUDED.skill,
        venue_name = EXCLUDED.venue_name,
        address = EXCLUDED.address,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        distance_km = EXCLUDED.distance_km,
        date_time_str = EXCLUDED.date_time_str,
        start_time_iso = EXCLUDED.start_time_iso,
        end_time_iso = EXCLUDED.end_time_iso,
        cost = EXCLUDED.cost,
        confirmed_players = EXCLUDED.confirmed_players,
        max_players = EXCLUDED.max_players,
        host_name = EXCLUDED.host_name,
        host_karma = EXCLUDED.host_karma,
        host_avatar = EXCLUDED.host_avatar,
        notes = EXCLUDED.notes,
        user_joined = EXCLUDED.user_joined,
        is_user_host = EXCLUDED.is_user_host,
        min_karma_required = EXCLUDED.min_karma_required,
        completed_check_in = EXCLUDED.completed_check_in
      `,
      [
        event.id,
        event.title,
        event.sport,
        event.icon,
        event.skill,
        event.venue,
        event.address || event.venue,
        event.lat,
        event.lng,
        event.distanceKm,
        event.dateTimeStr,
        event.startTimeIso || null,
        event.endTimeIso || null,
        event.cost,
        event.confirmedPlayers,
        event.maxPlayers,
        event.host.name,
        event.host.karma,
        event.host.avatar,
        event.notes,
        Boolean(event.userJoined),
        Boolean(event.isUserHost),
        event.minKarmaRequired ?? null,
        Boolean(event.completedCheckIn),
      ]
    );

    await client.query("DELETE FROM event_participants WHERE event_id = $1", [
      event.id,
    ]);
    for (const p of event.roster) {
      const rsvpStatus = p.role === "Waitlist" ? "WAITLISTED" : "CONFIRMED";
      await client.query(
        `
        INSERT INTO event_participants (
          event_id, player_name, role, karma, attendance, rsvp_status
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (event_id, player_name) DO UPDATE SET
          role = EXCLUDED.role,
          karma = EXCLUDED.karma,
          attendance = EXCLUDED.attendance,
          rsvp_status = EXCLUDED.rsvp_status
        `,
        [
          event.id,
          p.name,
          p.role,
          p.karma,
          p.attendance || null,
          rsvpStatus,
        ]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function pgDeleteEvent(eventId: number): Promise<void> {
  const pool = getPgPool();
  await pool.query("DELETE FROM events WHERE id = $1", [eventId]);
  await pool.query("DELETE FROM chat_channels WHERE event_id = $1", [eventId]);
}

/**
 * Upserts a Squad into PostgreSQL.
 */
export async function pgUpsertSquad(squad: TeamSquad): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `
    INSERT INTO squads (
      id, name, sport, abbr, variant, member_count, max_members,
      description, captain_name, home_venue, stat_label, stat_value
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      sport = EXCLUDED.sport,
      abbr = EXCLUDED.abbr,
      variant = EXCLUDED.variant,
      member_count = EXCLUDED.member_count,
      max_members = EXCLUDED.max_members,
      description = EXCLUDED.description,
      captain_name = EXCLUDED.captain_name,
      home_venue = EXCLUDED.home_venue,
      stat_label = EXCLUDED.stat_label,
      stat_value = EXCLUDED.stat_value
    `,
    [
      squad.id,
      squad.name,
      squad.sport,
      squad.abbr,
      squad.variant,
      squad.memberCount,
      squad.maxMembers,
      squad.description,
      squad.captain,
      squad.venue || "Central Turf Arena",
      squad.statLabel,
      squad.statValue,
    ]
  );
}

export async function pgDeleteSquad(squadId: number): Promise<void> {
  const pool = getPgPool();
  await pool.query("DELETE FROM squads WHERE id = $1", [squadId]);
  await pool.query("DELETE FROM chat_channels WHERE squad_id = $1", [squadId]);
}

export async function pgSyncRequestedSquads(
  requestedSquadIds: number[],
  userId = 1
): Promise<void> {
  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM squad_members WHERE user_id = $1 AND member_role = 'PENDING'",
      [userId]
    );
    for (const sqId of requestedSquadIds) {
      await client.query(
        `
        INSERT INTO squad_members (squad_id, user_id, member_role)
        SELECT $1, $2, 'PENDING'
        WHERE EXISTS (SELECT 1 FROM squads WHERE id = $1)
          AND EXISTS (SELECT 1 FROM users WHERE id = $2)
        ON CONFLICT (squad_id, user_id) DO NOTHING
        `,
        [sqId, userId]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Upserts a ChatChannel and its messages into PostgreSQL.
 */
export async function pgUpsertChatChannel(channel: ChatChannel): Promise<void> {
  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
      INSERT INTO chat_channels (
        id, event_id, squad_id, title, subtitle, sport_icon,
        last_message, last_time, is_pinned, pinned_at, pinned_announcement, pinned_items_json
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (id) DO UPDATE SET
        event_id = EXCLUDED.event_id,
        squad_id = EXCLUDED.squad_id,
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        sport_icon = EXCLUDED.sport_icon,
        last_message = EXCLUDED.last_message,
        last_time = EXCLUDED.last_time,
        is_pinned = EXCLUDED.is_pinned,
        pinned_at = EXCLUDED.pinned_at,
        pinned_announcement = EXCLUDED.pinned_announcement,
        pinned_items_json = EXCLUDED.pinned_items_json
      `,
      [
        channel.id,
        channel.eventId ?? null,
        channel.squadId ?? null,
        channel.title,
        channel.subtitle,
        channel.sportIcon,
        channel.lastMessage,
        channel.lastTime,
        Boolean(channel.isPinned),
        channel.pinnedAt ?? null,
        channel.pinnedAnnouncement ?? null,
        JSON.stringify(channel.pinnedItems || []),
      ]
    );

    await client.query("DELETE FROM chat_messages WHERE channel_id = $1", [
      channel.id,
    ]);
    for (const m of channel.messages) {
      await client.query(
        `
        INSERT INTO chat_messages (
          id, channel_id, sender_name, sender_avatar, time_label,
          message_text, is_host, is_self
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          m.id,
          channel.id,
          m.sender,
          m.avatar,
          m.time,
          m.text,
          Boolean(m.isHost),
          Boolean(m.isSelf),
        ]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function pgDeleteChatChannel(channelId: number): Promise<void> {
  const pool = getPgPool();
  await pool.query("DELETE FROM chat_channels WHERE id = $1", [channelId]);
}

/**
 * Loads the complete DatabaseState from PostgreSQL tables.
 */
export async function pgLoadFullState(): Promise<DatabaseState | null> {
  try {
    const pool = getPgPool();

    const [
      usersRes,
      sportsRes,
      availRes,
      badgesRes,
      venuesRes,
      eventsRes,
      participantsRes,
      squadsRes,
      squadMembersRes,
      channelsRes,
      messagesRes,
    ] = await Promise.all([
      pool.query("SELECT * FROM users ORDER BY created_at ASC"),
      pool.query("SELECT * FROM user_sports_passport ORDER BY id ASC"),
      pool.query("SELECT * FROM user_availability ORDER BY day_order ASC, id ASC"),
      pool.query("SELECT * FROM badges ORDER BY id ASC"),
      pool.query("SELECT * FROM venues ORDER BY id ASC"),
      pool.query("SELECT * FROM events ORDER BY id ASC"),
      pool.query("SELECT * FROM event_participants ORDER BY id ASC"),
      pool.query("SELECT * FROM squads ORDER BY id ASC"),
      pool.query("SELECT * FROM squad_members WHERE member_role = 'PENDING'"),
      pool.query("SELECT * FROM chat_channels ORDER BY id ASC"),
      pool.query("SELECT * FROM chat_messages ORDER BY id ASC"),
    ]);

    if (usersRes.rows.length === 0 && eventsRes.rows.length === 0) {
      return null;
    }

    const users: AuthUserAccount[] = usersRes.rows.map((u) => {
      const numericUserId = Number(u.id);
      const sports: SportPassportItem[] = sportsRes.rows
        .filter((s) => Number(s.user_id) === numericUserId)
        .map((s) => ({
          id: Number(s.id),
          name: s.sport_name,
          icon: s.sport_icon,
          role: s.preferred_role,
          skillTier: s.skill_tier,
          verifications: s.verifications_label,
        }));

      const availability: UserProfile["availability"] = availRes.rows
        .filter((a) => Number(a.user_id) === numericUserId)
        .map((a) => ({
          day: a.day_code,
          status: a.status_label,
          statusType: a.status_type as "busy" | "preferred" | "primary",
        }));

      const badges: UserProfile["badges"] = badgesRes.rows
        .filter((b) => Number(b.user_id) === numericUserId)
        .map((b) => ({
          label: b.label,
          count: Number(b.awarded_count),
        }));

      return {
        id: numericUserId,
        email: u.email,
        passwordHash: u.password_hash,
        onboardingCompleted: Boolean(u.onboarding_completed),
        profile: {
          name: u.name,
          username: u.username,
          location: u.location_label,
          avatar: u.avatar_url,
          karma: Number(u.karma_score),
          tier: u.karma_tier,
          bio: u.bio,
          matchesCount: Number(u.matches_count),
          noShowsCount: Number(u.no_shows_count),
          endorsedCount: Number(u.endorsed_count),
          badges,
          sports,
          availability,
        },
      };
    });

    const venues: SportsVenueRecord[] = venuesRes.rows.map((v) => ({
      id: Number(v.id),
      name: v.name,
      address: v.address,
      sports: Array.isArray(v.sport_types) ? v.sport_types : [],
      lat: Number(v.lat),
      lng: Number(v.lng),
      distanceKm: Number(v.distance_km),
      verified: Boolean(v.is_verified),
    }));

    const events: EventActivity[] = eventsRes.rows.map((e) => {
      const roster: RosterPlayer[] = participantsRes.rows
        .filter((p) => Number(p.event_id) === Number(e.id))
        .map((p) => ({
          name: p.player_name,
          role: p.role,
          karma: Number(p.karma),
          ...(p.attendance
            ? { attendance: p.attendance as AttendanceStatus }
            : {}),
        }));

      return {
        id: Number(e.id),
        title: e.title,
        sport: e.sport,
        icon: e.icon,
        skill: e.skill,
        venue: e.venue_name,
        address: e.address || e.venue_name,
        lat: Number(e.lat),
        lng: Number(e.lng),
        distanceKm: Number(e.distance_km),
        dateTimeStr: e.date_time_str,
        ...(e.start_time_iso ? { startTimeIso: e.start_time_iso } : {}),
        ...(e.end_time_iso ? { endTimeIso: e.end_time_iso } : {}),
        cost: e.cost,
        confirmedPlayers: Number(e.confirmed_players),
        maxPlayers: Number(e.max_players),
        host: {
          name: e.host_name,
          karma: Number(e.host_karma),
          avatar: e.host_avatar,
        },
        notes: e.notes,
        userJoined: Boolean(e.user_joined),
        isUserHost: Boolean(e.is_user_host),
        ...(e.min_karma_required !== null && e.min_karma_required !== undefined
          ? { minKarmaRequired: Number(e.min_karma_required) }
          : {}),
        completedCheckIn: Boolean(e.completed_check_in),
        roster,
      };
    });

    const squads: TeamSquad[] = squadsRes.rows.map((sq) => ({
      id: Number(sq.id),
      name: sq.name,
      sport: sq.sport,
      abbr: sq.abbr,
      variant: "white",
      memberCount: Number(sq.member_count),
      maxMembers: Number(sq.max_members),
      description: sq.description,
      captain: sq.captain_name,
      venue: sq.home_venue,
      statLabel: sq.stat_label,
      statValue: sq.stat_value,
    }));

    const requestedSquadIds = squadMembersRes.rows.map((r) =>
      Number(r.squad_id)
    );

    const chatChannels: ChatChannel[] = channelsRes.rows.map((c) => {
      const messages: ChatMessage[] = messagesRes.rows
        .filter((m) => Number(m.channel_id) === Number(c.id))
        .map((m) => ({
          id: Number(m.id),
          sender: m.sender_name,
          avatar: m.sender_avatar,
          time: m.time_label,
          text: m.message_text,
          isHost: Boolean(m.is_host),
          isSelf: Boolean(m.is_self),
        }));

      const pinnedItems: PinnedChatMessage[] = Array.isArray(c.pinned_items_json)
        ? c.pinned_items_json
        : [];

      return {
        id: Number(c.id),
        ...(c.event_id ? { eventId: Number(c.event_id) } : {}),
        ...(c.squad_id ? { squadId: Number(c.squad_id) } : {}),
        title: c.title,
        subtitle: c.subtitle,
        sportIcon: c.sport_icon,
        lastMessage: c.last_message,
        lastTime: c.last_time,
        isPinned: Boolean(c.is_pinned),
        ...(c.pinned_at ? { pinnedAt: Number(c.pinned_at) } : {}),
        ...(c.pinned_announcement
          ? { pinnedAnnouncement: c.pinned_announcement }
          : {}),
        pinnedItems,
        messages,
      };
    });

    return {
      users,
      events,
      venues,
      squads,
      requestedSquadIds,
      chatChannels,
    };
  } catch {
    return null;
  }
}

/**
 * Ensures PostgreSQL is seeded with initial data if empty, and syncs the in-memory store with PostgreSQL.
 */
export async function ensurePostgresSynced(
  seedState: DatabaseState
): Promise<DatabaseState> {
  if (!globalForPg.__teamupPgInitPromise) {
    globalForPg.__teamupPgInitPromise = (async () => {
      try {
        const existing = await pgLoadFullState();
        if (!existing) {
          for (const u of seedState.users) {
            await pgUpsertUser(u);
          }
          for (const v of seedState.venues) {
            await pgUpsertVenue(v);
          }
          for (const ev of seedState.events) {
            await pgUpsertEvent(ev);
          }
          for (const sq of seedState.squads) {
            await pgUpsertSquad(sq);
          }
          for (const ch of seedState.chatChannels) {
            await pgUpsertChatChannel(ch);
          }
        }
        return true;
      } catch {
        return false;
      }
    })();
  }

  await globalForPg.__teamupPgInitPromise;
  const loaded = await pgLoadFullState();
  if (loaded) {
    seedState.users = loaded.users;
    seedState.events = loaded.events;
    seedState.venues = loaded.venues;
    seedState.squads = loaded.squads;
    seedState.requestedSquadIds = loaded.requestedSquadIds;
    seedState.chatChannels = loaded.chatChannels;
  }
  return seedState;
}
