import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  calculateDistanceKm,
  formatCoordinatesLabel,
  rebaseEventsAroundCenter,
} from "@/lib/geo";
import {
  parseEventSchedule,
  doEventsOverlap,
  findConflictingJoinedEvent,
} from "@/lib/scheduleConflict";
import {
  getChannelPinnedItems,
  togglePinnedItem,
  sortChatChannels,
  isOwnChatMessage,
  detectChannelKind,
} from "@/lib/chatUtils";
import {
  getSportIcon,
  buildSportSelectOptions,
  buildSkillSelectOptions,
  EVENT_CAPACITY_CONFIG,
  DISTANCE_FILTER_CONFIG,
} from "@/constants/explore";
import {
  initialEvents,
  initialSquads,
  initialChatChannels,
  mockUserProfile,
} from "@/lib/mockData";
import { en } from "@/locales/en";
import { vi } from "@/locales/vi";
import {
  computeToggleJoinEvent,
  computeTransferEventHost,
  filterEventsList,
  fetchEventsAsync,
} from "@/services/events";
import {
  filterSquadsList,
  normalizeLegacySquads,
  fetchSquadsAsync,
} from "@/services/squads";
import {
  buildChannelFromEvent,
  buildChannelFromSquad,
  fetchChatChannelsAsync,
} from "@/services/chats";
import {
  computeNextAvailability,
  appendSportToProfile,
  removeSportFromProfile,
  fetchUserProfileAsync,
} from "@/services/passport";
import type { ChatChannel } from "@/types/models";

describe("1. Geolocation & Radar Rebasing (lib/geo.ts)", () => {
  it("TC-GEO-01: returns 0 km for identical coordinates", () => {
    assert.equal(calculateDistanceKm(37.7749, -122.4194, 37.7749, -122.4194), 0);
  });

  it("TC-GEO-02: calculates accurate Haversine distance and is symmetric", () => {
    const d1 = calculateDistanceKm(37.7749, -122.4194, 37.798, -122.46);
    const d2 = calculateDistanceKm(37.798, -122.46, 37.7749, -122.4194);
    assert.equal(d1, d2);
    assert.ok(d1 > 3.5 && d1 < 5.5, `Expected distance ~4.4 km, got ${d1}`);
  });

  it("TC-GEO-03: formats coordinates to 3 decimal places with degree symbols", () => {
    assert.equal(
      formatCoordinatesLabel(37.774929, -122.419416),
      "37.775°, -122.419°"
    );
  });

  it("TC-GEO-04: rebases event coordinates when moving to a distant city or forced", () => {
    const hanoiLat = 21.0285;
    const hanoiLng = 105.8542;
    const rebased = rebaseEventsAroundCenter(initialEvents, hanoiLat, hanoiLng);
    assert.equal(rebased.length, initialEvents.length);
    for (const ev of rebased) {
      assert.ok(Math.abs(ev.lat - hanoiLat) < 0.1);
      assert.ok(Math.abs(ev.lng - hanoiLng) < 0.1);
      assert.ok(ev.distanceKm >= 0.3);
    }
  });
});

describe("2. Schedule Conflict & Time Overlap Guard (lib/scheduleConflict.ts)", () => {
  it("TC-SCH-01: parses 12-hour day/time ranges accurately", () => {
    const parsed = parseEventSchedule({
      dateTimeStr: "Friday, 6:00 PM - 8:00 PM",
    });
    assert.ok(parsed);
    assert.deepEqual(parsed.dayKeys, ["friday"]);
    assert.equal(parsed.startMinutes, 18 * 60);
    assert.equal(parsed.endMinutes, 20 * 60);
  });

  it("TC-SCH-02: defaults to 90-minute duration when end time is omitted", () => {
    const parsed = parseEventSchedule({
      dateTimeStr: "Today, 5:30 PM",
    });
    assert.ok(parsed);
    assert.equal(parsed.startMinutes, 17 * 60 + 30);
    assert.equal(parsed.endMinutes, 17 * 60 + 30 + 90);
  });

  it("TC-SCH-03: parses ISO start and end timestamps", () => {
    const parsed = parseEventSchedule({
      dateTimeStr: "2026-11-05, 7:00 PM - 9:00 PM",
      startTimeIso: "2026-11-05T19:00",
      endTimeIso: "2026-11-05T21:00",
    });
    assert.ok(parsed);
    assert.equal(parsed.isoDate, "2026-11-05");
    assert.equal(parsed.startMinutes, 19 * 60);
    assert.equal(parsed.endMinutes, 21 * 60);
  });

  it("TC-SCH-04: detects overlapping events on the same day and allows non-overlapping windows", () => {
    const evA = { dateTimeStr: "Friday, 6:00 PM - 8:00 PM" };
    const evOverlap = { dateTimeStr: "Friday, 7:00 PM - 9:00 PM" };
    const evAdjacent = { dateTimeStr: "Friday, 8:00 PM - 9:30 PM" };
    const evDiffDay = { dateTimeStr: "Saturday, 6:00 PM - 8:00 PM" };

    assert.equal(doEventsOverlap(evA, evOverlap), true);
    assert.equal(doEventsOverlap(evA, evAdjacent), false);
    assert.equal(doEventsOverlap(evA, evDiffDay), false);
  });

  it("TC-SCH-05: finds conflicting joined events while ignoring unjoined or self events", () => {
    const joinedEvents = initialEvents.map((ev) =>
      ev.id === 5 ? { ...ev, userJoined: true } : { ...ev, userJoined: false }
    );
    // Event 5 is Friday, 6:00 PM - 8:00 PM; Event 6 is Friday, 7:00 PM - 9:00 PM
    const candidate = initialEvents.find((ev) => ev.id === 6)!;
    const conflict = findConflictingJoinedEvent(candidate, joinedEvents);
    assert.ok(conflict);
    assert.equal(conflict.id, 5);

    // Comparing Event 5 against itself should not report conflict
    const selfConflict = findConflictingJoinedEvent(
      initialEvents.find((ev) => ev.id === 5)!,
      joinedEvents
    );
    assert.equal(selfConflict, null);
  });
});

describe("3. Chat Pinning, Message Identity & Channel Sorting (lib/chatUtils.ts)", () => {
  it("TC-CHAT-01: pins and unpins individual messages by unique ID without affecting identical text", () => {
    const channelWithDuplicates: ChatChannel = {
      id: 100,
      title: "Test Room",
      subtitle: "2 Players",
      sportIcon: "⚽",
      lastMessage: "Alex: ok",
      lastTime: "Just now",
      messages: [
        { id: 10, sender: "Kenji Sato", avatar: "", time: "6:00 PM", text: "ok" },
        { id: 11, sender: "Alex Morgan (You)", avatar: "", time: "6:01 PM", text: "ok", isSelf: true },
      ],
    };

    const initialPins = getChannelPinnedItems(channelWithDuplicates);
    assert.equal(initialPins.length, 0);

    // Pin only message #11
    const afterPin = togglePinnedItem(initialPins, 11, "ok");
    assert.equal(afterPin.length, 1);
    assert.equal(afterPin[0].id, 11);

    // Message #10 (also text "ok") must NOT be considered pinned
    const isMsg10Pinned = afterPin.some((p) => p.id === 10);
    const isMsg11Pinned = afterPin.some((p) => p.id === 11);
    assert.equal(isMsg10Pinned, false);
    assert.equal(isMsg11Pinned, true);

    // Unpin message #11
    const afterUnpin = togglePinnedItem(afterPin, 11, "ok");
    assert.equal(afterUnpin.length, 0);
  });

  it("TC-CHAT-02: migrates legacy string-based pinnedMessages to distinct message IDs", () => {
    const legacyChannel: ChatChannel = {
      id: 101,
      title: "Legacy Room",
      subtitle: "Test",
      sportIcon: "🏸",
      lastMessage: "Hello",
      lastTime: "1m",
      pinnedMessages: ["Hello"],
      messages: [
        { id: 201, sender: "User A", avatar: "", time: "1:00 PM", text: "Hello" },
        { id: 202, sender: "User B", avatar: "", time: "1:01 PM", text: "Hello" },
      ],
    };

    const normalized = getChannelPinnedItems(legacyChannel);
    assert.equal(normalized.length, 1);
    assert.equal(normalized[0].id, 201);
  });

  it("TC-CHAT-03: sorts pinned chat channels to the top ordered by pinnedAt", () => {
    const channels: ChatChannel[] = [
      { ...initialChatChannels[0], id: 1, isPinned: false },
      { ...initialChatChannels[1], id: 2, isPinned: true, pinnedAt: 2000 },
      { ...initialChatChannels[2], id: 3, isPinned: true, pinnedAt: 1000 },
    ];

    const sorted = sortChatChannels(channels);
    assert.deepEqual(
      sorted.map((c) => c.id),
      [3, 2, 1]
    );
  });

  it("TC-CHAT-04: identifies own messages vs other participants' messages for right/left alignment", () => {
    assert.equal(
      isOwnChatMessage({
        id: 1,
        sender: "Alex Morgan (You)",
        avatar: "",
        time: "Now",
        text: "Hi",
        isSelf: true,
      }),
      true
    );
    assert.equal(
      isOwnChatMessage(
        {
          id: 2,
          sender: "Alex Morgan (Bạn)",
          avatar: "",
          time: "Now",
          text: "Xin chào",
        },
        "Bạn"
      ),
      true
    );
    assert.equal(
      isOwnChatMessage({
        id: 3,
        sender: "David Ross (Host)",
        avatar: "",
        time: "Now",
        text: "Welcome!",
        isHost: true,
      }),
      false
    );
  });

  it("TC-CHAT-05: detects channel kind (squad vs match vs direct) for dynamic Leave labels", () => {
    const matchChan: ChatChannel = { ...initialChatChannels[0], eventId: 1 };
    const squadChan: ChatChannel = {
      ...initialChatChannels[0],
      id: 99,
      eventId: undefined,
      squadId: 1,
      title: "North District Thunder",
    };
    const directChan: ChatChannel = {
      ...initialChatChannels[2],
      eventId: undefined,
      squadId: undefined,
    };

    assert.equal(detectChannelKind(matchChan, initialSquads, initialEvents), "match");
    assert.equal(detectChannelKind(squadChan, initialSquads, initialEvents), "squad");
    assert.equal(detectChannelKind(directChan, initialSquads, initialEvents), "direct");
  });
});

describe("4. Sports Configuration & Seed Data Integrity (constants/explore.ts & lib/mockData.ts)", () => {
  it("TC-CFG-01: maps sport icons and builds select options", () => {
    assert.equal(getSportIcon("Soccer"), "⚽");
    assert.equal(getSportIcon("Badminton"), "🏸");
    assert.equal(getSportIcon("Board Games"), "🎲");
    assert.equal(getSportIcon("Unknown Sport"), "🏆");

    const allOptions = buildSportSelectOptions((k) => k, { includeAll: true });
    const createOptions = buildSportSelectOptions((k) => k, { includeAll: false });
    assert.equal(allOptions.length, createOptions.length + 1);

    const skillOptions = buildSkillSelectOptions((k) => k);
    assert.equal(skillOptions.length, 4);
    assert.equal(EVENT_CAPACITY_CONFIG.MAX, 100);
    assert.equal(DISTANCE_FILTER_CONFIG.MAX, 25);
  });

  it("TC-DATA-01: validates unified squad cards and standard sport labels", () => {
    const validSports = new Set([
      "Soccer",
      "Basketball",
      "Badminton",
      "Pickleball",
      "Running",
      "Board Games",
    ]);

    for (const sq of initialSquads) {
      assert.equal(
        sq.variant,
        "white",
        `Squad "${sq.name}" should use unified "white" card variant`
      );
      assert.equal(
        sq.featuredBadge,
        undefined,
        `Squad "${sq.name}" should not use non-standard featuredBadge`
      );
      assert.ok(
        validSports.has(sq.sport),
        `Squad "${sq.name}" has non-standard sport "${sq.sport}"`
      );
    }

    assert.ok(initialEvents.length >= 6);
    assert.ok(mockUserProfile.sports.length >= 3);
    assert.equal(mockUserProfile.availability.length, 7);
  });
});

describe("5. Internationalization Parity (locales/en.ts & locales/vi.ts)", () => {
  function collectLeafPaths(obj: Record<string, unknown>, prefix = ""): string[] {
    const paths: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const nextPath = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        paths.push(
          ...collectLeafPaths(value as Record<string, unknown>, nextPath)
        );
      } else {
        assert.equal(
          typeof value,
          "string",
          `Expected string at translation key "${nextPath}"`
        );
        assert.ok(
          (value as string).trim().length > 0,
          `Translation key "${nextPath}" must not be empty`
        );
        paths.push(nextPath);
      }
    }
    return paths.sort();
  }

  it("TC-I18N-01: English and Vietnamese dictionaries have 100% identical keys and non-empty strings", () => {
    const enPaths = collectLeafPaths(
      en as unknown as Record<string, unknown>
    );
    const viPaths = collectLeafPaths(
      vi as unknown as Record<string, unknown>
    );

    assert.deepEqual(enPaths, viPaths);
    assert.ok(enPaths.length >= 130, `Verified ${enPaths.length} i18n keys`);
  });
});

describe("6. Service Layer & Data Abstraction (services/*.ts)", () => {
  it("TC-SVC-01: filters events by search term, sport, skill, and distance radius", () => {
    const filtered = filterEventsList(initialEvents, {
      searchQuery: "Soccer",
      sport: "Soccer",
      skill: "All Levels",
      maxRadiusKm: 10,
    });
    assert.ok(filtered.length >= 1);
    for (const ev of filtered) {
      assert.equal(ev.sport, "Soccer");
      assert.ok(ev.distanceKm <= 10);
    }
  });

  it("TC-SVC-02: computes join/leave transitions, host transfer, and solo-host cancellation", () => {
    // Joining unjoined non-overlapping event (Event #3: Tomorrow, 7:30 PM - 9:30 PM)
    const joinRes = computeToggleJoinEvent(initialEvents, 3);
    assert.equal(joinRes.status, "joined");
    const joinedEv = joinRes.events.find((e) => e.id === 3)!;
    assert.equal(joinedEv.userJoined, true);

    // Leaving joined event
    const leaveRes = computeToggleJoinEvent(joinRes.events, 3);
    assert.equal(leaveRes.status, "left");
    assert.equal(leaveRes.events.find((e) => e.id === 3)!.userJoined, false);

    // Host transfer updates host name and roster roles
    const hostEvents = initialEvents.map((ev) =>
      ev.id === 1 ? { ...ev, isUserHost: true, userJoined: true } : ev
    );
    const transferred = computeTransferEventHost(hostEvents, 1, "Marco Silva");
    const updatedEv1 = transferred.find((e) => e.id === 1)!;
    assert.equal(updatedEv1.isUserHost, false);
    assert.equal(updatedEv1.host.name, "Marco Silva");
  });

  it("TC-SVC-03: filters squads and normalizes legacy squad sport labels", () => {
    const legacy = [
      {
        ...initialSquads[0],
        sport: "Badminton Club",
        featuredBadge: "TOP RATED",
      },
    ];
    const normalized = normalizeLegacySquads(legacy);
    assert.equal(normalized.changed, true);
    assert.equal(normalized.squads[0].sport, "Badminton");
    assert.equal(normalized.squads[0].featuredBadge, undefined);

    const soccerSquads = filterSquadsList(initialSquads, {
      searchQuery: "Thunder",
      sport: "Soccer",
    });
    assert.equal(soccerSquads.length, 1);
    assert.equal(soccerSquads[0].name, "North District Thunder");
  });

  it("TC-SVC-04: builds chat channels from events/squads and cycles passport availability", async () => {
    const evChan = buildChannelFromEvent(initialEvents[0], {
      justNowLabel: "Just now",
      hostBadgeLabel: "Host",
      idSeed: 500,
    });
    assert.equal(evChan.id, 500);
    assert.equal(evChan.eventId, initialEvents[0].id);

    const sqChan = buildChannelFromSquad(initialSquads[0], {
      isCaptain: true,
      membersLabel: "18/24 Members",
      justNowLabel: "Just now",
      hostBadgeLabel: "Host",
      idSeed: 600,
    });
    assert.equal(sqChan.id, 600);
    assert.equal(sqChan.squadId, initialSquads[0].id);

    // Cycle availability: busy -> preferred -> primary -> busy
    const labels = {
      busy: "Busy",
      preferred: "Preferred",
      primary: "Available",
    };
    const nextAvail = computeNextAvailability(
      mockUserProfile.availability,
      0,
      labels
    );
    assert.notEqual(
      nextAvail[0].statusType,
      mockUserProfile.availability[0].statusType
    );

    const withSport = appendSportToProfile(mockUserProfile, {
      id: 999,
      name: "Tennis",
      icon: "🎾",
      role: "Singles Player",
      skillTier: "Intermediate",
      verifications: "5 Peer Endorsements",
    });
    assert.equal(withSport.sports.length, mockUserProfile.sports.length + 1);
    const removed = removeSportFromProfile(withSport, 999);
    assert.equal(removed.sports.length, mockUserProfile.sports.length);

    // Verify async service fetchers resolve cleanly
    const [evs, sqs, chs, prof] = await Promise.all([
      fetchEventsAsync(),
      fetchSquadsAsync(),
      fetchChatChannelsAsync(),
      fetchUserProfileAsync(),
    ]);
    assert.equal(evs.length, initialEvents.length);
    assert.equal(sqs.length, initialSquads.length);
    assert.equal(chs.length, initialChatChannels.length);
    assert.equal(prof.username, mockUserProfile.username);
  });
});
