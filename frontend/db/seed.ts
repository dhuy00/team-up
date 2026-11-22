import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { getDbState } from "./store";

async function seedDatabase(connectionString: string) {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query(`
      DROP TABLE IF EXISTS
        karma_logs,
        chat_messages,
        chat_channels,
        squad_members,
        squads,
        event_participants,
        events,
        venues,
        badges,
        user_availability,
        user_sports_passport,
        users
      CASCADE;
    `);
    const schemaPath = path.resolve(process.cwd(), "db", "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await client.query(schemaSql);

    const state = getDbState();

    await client.query("BEGIN");

    // 1. Seed Users, Sports Profile, Availability, Badges
    for (const user of state.users) {
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
          user.profile.karma,
          user.profile.tier,
          user.profile.bio,
          user.profile.matchesCount,
          user.profile.noShowsCount,
          user.profile.endorsedCount,
          user.onboardingCompleted,
        ]
      );

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
    }

    // 2. Seed Venues
    for (const v of state.venues) {
      await client.query(
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
        [v.id, v.name, v.address, v.sports, v.lat, v.lng, v.distanceKm, v.verified]
      );
    }

    // 3. Seed Events & Participants
    for (const ev of state.events) {
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
          ev.id,
          ev.title,
          ev.sport,
          ev.icon,
          ev.skill,
          ev.venue,
          ev.address || ev.venue,
          ev.lat,
          ev.lng,
          ev.distanceKm,
          ev.dateTimeStr,
          ev.startTimeIso || null,
          ev.endTimeIso || null,
          ev.cost,
          ev.confirmedPlayers,
          ev.maxPlayers,
          ev.host.name,
          ev.host.karma,
          ev.host.avatar,
          ev.notes,
          Boolean(ev.userJoined),
          Boolean(ev.isUserHost),
          ev.minKarmaRequired ?? null,
          Boolean(ev.completedCheckIn),
        ]
      );

      await client.query("DELETE FROM event_participants WHERE event_id = $1", [
        ev.id,
      ]);
      for (const p of ev.roster) {
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
          [ev.id, p.name, p.role, p.karma, p.attendance || null, rsvpStatus]
        );
      }
    }

    // 4. Seed Squads
    for (const sq of state.squads) {
      await client.query(
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
          sq.id,
          sq.name,
          sq.sport,
          sq.abbr,
          sq.variant,
          sq.memberCount,
          sq.maxMembers,
          sq.description,
          sq.captain,
          sq.venue || "Central Turf Arena",
          sq.statLabel,
          sq.statValue,
        ]
      );
    }

    // 5. Seed Chat Channels & Messages
    for (const ch of state.chatChannels) {
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
          ch.id,
          ch.eventId ?? null,
          ch.squadId ?? null,
          ch.title,
          ch.subtitle,
          ch.sportIcon,
          ch.lastMessage,
          ch.lastTime,
          Boolean(ch.isPinned),
          ch.pinnedAt ?? null,
          ch.pinnedAnnouncement ?? null,
          JSON.stringify(ch.pinnedItems || []),
        ]
      );

      await client.query("DELETE FROM chat_messages WHERE channel_id = $1", [
        ch.id,
      ]);
      for (const m of ch.messages) {
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
            ch.id,
            m.sender,
            m.avatar,
            m.time,
            m.text,
            Boolean(m.isHost),
            Boolean(m.isSelf),
          ]
        );
      }
    }

    await client.query("COMMIT");

    const counts = await client.query(`
      SELECT
        current_database() AS database,
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM user_sports_passport) AS user_sports,
        (SELECT COUNT(*) FROM venues) AS venues,
        (SELECT COUNT(*) FROM events) AS events,
        (SELECT COUNT(*) FROM event_participants) AS participants,
        (SELECT COUNT(*) FROM squads) AS squads,
        (SELECT COUNT(*) FROM chat_channels) AS chat_channels,
        (SELECT COUNT(*) FROM chat_messages) AS chat_messages
    `);

    console.log("Seeded PostgreSQL successfully:", counts.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

async function createDatabaseIfMissing(
  baseUrl: string,
  targetDbName: string
): Promise<boolean> {
  const pool = new Pool({
    connectionString: `${baseUrl}/postgres`,
    connectionTimeoutMillis: 3000,
  });
  try {
    const check = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDbName]
    );
    if (check.rowCount === 0) {
      await pool.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`Created database "${targetDbName}" on ${baseUrl}`);
    }
    return true;
  } catch {
    return false;
  } finally {
    await pool.end();
  }
}

async function main() {
  const defaultUrl =
    process.env.DATABASE_URL || "postgresql://dhuy:123@localhost:5432/teamup";
  const parsed = new URL(defaultUrl);
  const targetDb = parsed.pathname.replace(/^\//, "") || "teamup";
  const baseUrl = `${parsed.protocol}//${parsed.username}:${parsed.password}@${parsed.host}`;

  const reachable = await createDatabaseIfMissing(baseUrl, targetDb);
  if (!reachable) {
    throw new Error(`Could not connect to PostgreSQL at ${baseUrl}`);
  }

  // Seed target database (teamup) AND also my_database & postgres if present (so HeidiSQL shows tables immediately regardless of which DB is selected in Session Manager)
  const dbsToSeed = Array.from(new Set([targetDb, "my_database", "postgres"]));
  for (const dbName of dbsToSeed) {
    const exists = await createDatabaseIfMissing(baseUrl, dbName);
    if (exists) {
      await seedDatabase(`${baseUrl}/${dbName}`);
    }
  }
}

main().catch((err) => {
  console.error("Failed to seed PostgreSQL:", err);
  process.exit(1);
});
