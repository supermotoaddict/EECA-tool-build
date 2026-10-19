"use client";

import { useSyncExternalStore } from "react";

const DISMISS_EVENT = "premier-field-install-dismissed";

let cachedSnapshot: { isIOS: boolean; isStandalone: boolean; dismissed: boolean } | null = null;

function subscribe(onStoreChange: () => void) {
  const handler = () => {
    cachedSnapshot = null; // Invalidate cache
    onStoreChange();
  };
  window.addEventListener(DISMISS_EVENT, handler);
  return () => window.removeEventListener(DISMISS_EVENT, handler);
}

function getInstallState() {
  if (cachedSnapshot) return cachedSnapshot;
  
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  const dismissed = sessionStorage.getItem(DISMISS_EVENT) === "1";
  
  cachedSnapshot = { isIOS: ios, isStandalone, dismissed };
  return cachedSnapshot;
}

const serverSnapshot = { isIOS: false, isStandalone: true, dismissed: true };

export default function InstallBanner() {
  const state = useSyncExternalStore(subscribe, getInstallState, () => serverSnapshot);

  if (state.isStandalone || state.dismissed || !state.isIOS) return null;

  return (
    <aside className="install-banner" role="note">
      <div>
        <strong>Install on iPhone</strong>
        <p>
          Tap Share <span aria-hidden>⎋</span> then <em>Add to Home Screen</em> for an app icon and
          full-screen map.
        </p>
      </div>
      <button
        type="button"
        className="ghost-btn compact"
        onClick={() => {
          sessionStorage.setItem(DISMISS_EVENT, "1");
          window.dispatchEvent(new Event(DISMISS_EVENT));
        }}
      >
        OK
      </button>
    </aside>
  );
}
