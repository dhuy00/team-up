import { EventActivity, NearbyPlayer } from "@/types/models";

export function buildRadarCenterIconHtml(): string {
  return `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div class="radar-pulse-ring" style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(159, 232, 112, 0.55); border: 2px solid #9fe870;"></div>
      <div style="position: relative; width: 16px; height: 16px; border-radius: 9999px; background: #0e0f0c; border: 3px solid #9fe870; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></div>
    </div>
  `;
}

export function buildRadarCenterPopupHtml(params: {
  radarCenterTitle: string;
  locationLabel: string;
  distanceWithinText: string;
}): string {
  return `
    <div style="font-family: 'Inter', sans-serif; padding: 2px 4px;">
      <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #2ead4b;">
        ${params.radarCenterTitle}
      </div>
      <div style="font-size: 12px; font-weight: 800; margin-top: 1px;">
        ${params.locationLabel}
      </div>
      <div style="font-size: 11px; opacity: 0.75; margin-top: 2px;">
        ${params.distanceWithinText}
      </div>
    </div>
  `;
}

export function buildNearbyPlayerIconHtml(player: NearbyPlayer): string {
  return `
    <div style="position: relative; width: 34px; height: 34px; cursor: pointer;" title="${player.name}">
      <img
        src="${player.avatar}"
        alt="${player.name}"
        style="width: 32px; height: 32px; border-radius: 9999px; object-fit: cover; border: 2px solid #0e0f0c; box-shadow: 0 3px 8px rgba(0,0,0,0.22); background: #fff;"
      />
      <span style="position: absolute; bottom: -2px; right: -2px; background: #ffffff; border: 1.5px solid #0e0f0c; border-radius: 9999px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px;">
        ${player.sportIcon}
      </span>
    </div>
  `;
}

export function buildNearbyPlayerPopupHtml(
  player: NearbyPlayer,
  distanceKm: number
): string {
  return `
    <div style="font-family: 'Inter', sans-serif; min-width: 185px; padding: 2px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <img src="${player.avatar}" alt="${player.name}" style="width: 32px; height: 32px; border-radius: 9999px; object-fit: cover; border: 1.5px solid #0e0f0c;" />
        <div>
          <div style="font-weight: 800; font-size: 12px; line-height: 1.2;">${player.name}</div>
          <div style="font-size: 10px; font-weight: 700; color: #2ead4b;">${player.karma}% Karma • ${player.skill}</div>
        </div>
      </div>
      <div style="font-size: 11px; padding: 5px 8px; border-radius: 8px; background: rgba(159, 232, 112, 0.2); border: 1px solid rgba(14,15,12,0.12); margin-bottom: 4px;">
        ${player.sportIcon} ${player.status}
      </div>
      <div style="font-size: 10px; opacity: 0.7; font-weight: 600;">
        📍 ${distanceKm} km from radar center
      </div>
    </div>
  `;
}

export function buildEventPinIconHtml(
  ev: EventActivity,
  isSelected: boolean
): string {
  const spotsLeft = ev.maxPlayers - ev.confirmedPlayers;
  const isFull = spotsLeft <= 0;

  return `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: ${
      isSelected ? "scale(1.15)" : "scale(1)"
    }; transition: transform 0.15s ease;">
      <div style="background: ${
        isFull ? "#ffd11a" : "#9fe870"
      }; color: #0e0f0c; height: 34px; padding: 0 10px; border-radius: 9999px; display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 800; border: 2px solid #0e0f0c; box-shadow: 0 4px 10px rgba(0,0,0,0.22); white-space: nowrap;">
        <span>${ev.icon}</span>
        <span style="font-size: 11px; font-family: monospace;">${
          ev.confirmedPlayers
        }/${ev.maxPlayers}</span>
      </div>
      <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #0e0f0c; margin-top: -1px;"></div>
    </div>
  `;
}

export function createEventPopupElement(
  ev: EventActivity,
  detailsLabel: string,
  onSelectEvent: (event: EventActivity) => void
): HTMLDivElement {
  const popupEl = document.createElement("div");
  popupEl.style.fontFamily = "'Inter', sans-serif";
  popupEl.style.minWidth = "205px";
  popupEl.style.padding = "2px";
  popupEl.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
      <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; background: #e2f6d5; color: #054d28; padding: 2px 7px; border-radius: 9999px; border: 1px solid #c5edab;">
        ${ev.icon} ${ev.sport}
      </span>
      <span style="font-size: 11px; font-weight: 700;">
        ${ev.distanceKm} km
      </span>
    </div>
    <div style="font-weight: 900; font-size: 13px; line-height: 1.25; margin-bottom: 4px;">
      ${ev.title}
    </div>
    <div style="font-size: 11px; opacity: 0.8; margin-bottom: 2px;">
      📍 ${ev.venue}
    </div>
    <div style="font-size: 11px; opacity: 0.8; margin-bottom: 8px;">
      ⏰ ${ev.dateTimeStr}
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid rgba(134,134,133,0.25);">
      <span style="font-size: 11px; font-weight: 800;">
        ${ev.confirmedPlayers}/${ev.maxPlayers} spots
      </span>
      <button
        type="button"
        class="radar-popup-detail-btn"
        style="background: #9fe870; color: #0e0f0c; border: 1.5px solid #0e0f0c; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; cursor: pointer;"
      >
        ${detailsLabel}
      </button>
    </div>
  `;

  const detailBtn = popupEl.querySelector(".radar-popup-detail-btn");
  if (detailBtn) {
    detailBtn.addEventListener("click", () => {
      onSelectEvent(ev);
    });
  }

  return popupEl;
}
