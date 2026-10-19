"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearAllTracks,
  exportBackup,
  importBackup,
  listSites,
  listTracks,
  saveSite,
  saveTrack,
  deleteSite,
  type FieldBackup,
} from "@/lib/field/storage";
import {
  createEmptySite,
  type LatLng,
  type RouteTrack,
  type SiteVisit,
  type TrackPoint,
} from "@/lib/field/types";
import {
  DEFAULT_CENTER,
  formatDistance,
  shouldRecordPoint,
  trackLengthMeters,
} from "@/lib/field/geo";
import SiteEditor from "./SiteEditor";
import SiteList from "./SiteList";
import InstallBanner from "./InstallBanner";

const FieldMap = dynamic(() => import("./FieldMap"), {
  ssr: false,
  loading: () => <div className="field-map field-map-loading">Loading map…</div>,
});

type Panel = "none" | "editor" | "list" | "help";

export default function FieldApp() {
  const [sites, setSites] = useState<SiteVisit[]>([]);
  const [tracks, setTracks] = useState<RouteTrack[]>([]);
  const [ready, setReady] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [liveTrack, setLiveTrack] = useState<RouteTrack | null>(null);
  const [userPosition, setUserPosition] = useState<LatLng | null>(null);
  const [followUser, setFollowUser] = useState(true);
  const [placingPin, setPlacingPin] = useState(false);
  const [panel, setPanel] = useState<Panel>("none");
  const [draft, setDraft] = useState<SiteVisit | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const watchId = useRef<number | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const liveTrackRef = useRef<RouteTrack | null>(null);

  const refresh = useCallback(async () => {
    const [s, t] = await Promise.all([listSites(), listTracks()]);
    setSites(s);
    setTracks(t);
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
      setReady(true);
    })();
  }, [refresh]);

  useEffect(() => {
    liveTrackRef.current = liveTrack;
  }, [liveTrack]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLock.current?.release();
    } catch {
      /* ignore */
    }
    wakeLock.current = null;
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLock.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      /* unsupported or denied */
    }
  }, []);

  const persistLiveTrack = useCallback(async (track: RouteTrack, ended = false) => {
    const next = ended
      ? { ...track, endedAt: track.endedAt ?? new Date().toISOString() }
      : track;
    await saveTrack(next);
    await refresh();
  }, [refresh]);

  const onPosition = useCallback(
    (pos: GeolocationPosition) => {
      const point: TrackPoint = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        t: pos.timestamp || Date.now(),
        accuracy: pos.coords.accuracy,
      };
      setUserPosition({ lat: point.lat, lng: point.lng });
      setGeoError(null);

      const current = liveTrackRef.current;
      if (!current) return;
      const last = current.points[current.points.length - 1];
      if (!shouldRecordPoint(last, point)) return;
      const updated: RouteTrack = {
        ...current,
        points: [...current.points, point],
      };
      setLiveTrack(updated);
      void persistLiveTrack(updated);
    },
    [persistLiveTrack]
  );

  const stopTracking = useCallback(async () => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setTracking(false);
    await releaseWakeLock();
    const current = liveTrackRef.current;
    if (current && current.points.length > 0) {
      await persistLiveTrack(current, true);
      setToast(`Route saved · ${formatDistance(trackLengthMeters(current.points))}`);
    }
    setLiveTrack(null);
  }, [persistLiveTrack, releaseWakeLock]);

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError("Location is not available in this browser.");
      return;
    }
    const track: RouteTrack = {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      points: [],
    };
    setLiveTrack(track);
    liveTrackRef.current = track;
    setTracking(true);
    setFollowUser(true);
    await requestWakeLock();
    await persistLiveTrack(track);

    watchId.current = navigator.geolocation.watchPosition(onPosition, (err) => {
      setGeoError(err.message || "Could not read GPS. Check Location Services for Safari.");
    }, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 20000,
    });
    setToast("Tracking on — leave this screen open while you drive.");
  }, [onPosition, persistLiveTrack, requestWakeLock]);

  useEffect(() => {
    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      void releaseWakeLock();
    };
  }, [releaseWakeLock]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setUserPosition(DEFAULT_CENTER);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  const livePoints = useMemo(() => liveTrack?.points ?? [], [liveTrack]);
  const liveKm = useMemo(() => formatDistance(trackLengthMeters(livePoints)), [livePoints]);
  const coveredKm = useMemo(() => {
    const all = tracks.flatMap((t) => t.points);
    return formatDistance(trackLengthMeters(all));
  }, [tracks]);

  function openNewAt(coords: LatLng) {
    const site = createEmptySite({
      lat: coords.lat,
      lng: coords.lng,
      status: "introduced",
    });
    setDraft(site);
    setPlacingPin(false);
    setPanel("editor");
  }

  function openExisting(id: string) {
    const site = sites.find((s) => s.id === id);
    if (!site) return;
    setDraft({ ...site });
    setPanel("editor");
    setFollowUser(false);
  }

  async function handleSaveDraft() {
    if (!draft) return;
    if (!draft.name.trim()) {
      setToast("Add a site name before saving.");
      return;
    }
    await saveSite({
      ...draft,
      name: draft.name.trim(),
      visitedAt: draft.visitedAt || new Date().toISOString(),
    });
    await refresh();
    setPanel("none");
    setDraft(null);
    setToast("Site saved on this phone.");
  }

  async function handleDeleteDraft() {
    if (!draft) return;
    await deleteSite(draft.id);
    await refresh();
    setPanel("none");
    setDraft(null);
    setToast("Site deleted.");
  }

  async function handleExport() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `premier-field-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Backup downloaded.");
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as FieldBackup;
      const result = await importBackup(data);
      await refresh();
      setToast(`Imported ${result.sites} sites and ${result.tracks} routes.`);
    } catch {
      setToast("Could not import that file.");
    }
  }

  async function handleClearTracks() {
    if (!confirm("Clear all recorded driving routes? Site pins stay.")) return;
    await clearAllTracks();
    await refresh();
    setToast("Routes cleared.");
  }

  function dropPinHere() {
    if (userPosition) {
      openNewAt(userPosition);
      return;
    }
    setPlacingPin(true);
    setToast("Tap the map to drop a site pin.");
  }

  if (!ready) {
    return <div className="field-boot">Loading Premier Field…</div>;
  }

  return (
    <div className={`field-app${placingPin ? " placing" : ""}`}>
      <header className="field-top">
        <div className="field-brand">
          <p className="brand-mark">Premier Solutions</p>
          <h1>Field</h1>
        </div>
        <div className="field-top-actions">
          <Link href="/" className="ghost-btn compact">
            WKH tool
          </Link>
          <button type="button" className="ghost-btn compact" onClick={() => setPanel("help")}>
            Help
          </button>
        </div>
      </header>

      <div className="field-map-wrap">
        <FieldMap
          sites={sites}
          tracks={tracks}
          livePoints={livePoints}
          userPosition={userPosition}
          selectedSiteId={draft?.id ?? null}
          placingPin={placingPin}
          onSelectSite={openExisting}
          onMapClick={openNewAt}
          followUser={followUser && tracking}
        />

        <div className="map-stats" aria-live="polite">
          <span>
            {sites.length} site{sites.length === 1 ? "" : "s"}
          </span>
          <span>{coveredKm} driven</span>
          {tracking && <span className="live">{liveKm} live</span>}
        </div>

        {geoError && <p className="geo-banner">{geoError}</p>}
        {placingPin && (
          <p className="place-banner">
            Tap map to place pin ·{" "}
            <button type="button" className="text-btn" onClick={() => setPlacingPin(false)}>
              Cancel
            </button>
          </p>
        )}
      </div>

      <nav className="field-dock" aria-label="Field actions">
        <button
          type="button"
          className={`dock-btn${tracking ? " active danger" : ""}`}
          onClick={() => void (tracking ? stopTracking() : startTracking())}
        >
          {tracking ? "Stop route" : "Track route"}
        </button>
        <button type="button" className="dock-btn" onClick={dropPinHere}>
          Log site
        </button>
        <button type="button" className="dock-btn" onClick={() => setPanel("list")}>
          Sites
        </button>
        <button
          type="button"
          className={`dock-btn${followUser ? " active" : ""}`}
          onClick={() => {
            setFollowUser(true);
            if (userPosition) {
              setUserPosition({ ...userPosition });
            }
          }}
        >
          Recentre
        </button>
      </nav>

      <InstallBanner />

      {toast && <div className="field-toast">{toast}</div>}

      {panel === "editor" && draft && (
        <div className="field-sheet" role="dialog" aria-modal="true">
          <SiteEditor
            site={draft}
            onChange={setDraft}
            onSave={() => void handleSaveDraft()}
            onDelete={() => void handleDeleteDraft()}
            onClose={() => {
              setPanel("none");
              setDraft(null);
            }}
          />
        </div>
      )}

      {panel === "list" && (
        <div className="field-sheet" role="dialog" aria-modal="true">
          <SiteList
            sites={sites}
            onSelect={(id) => openExisting(id)}
            onClose={() => setPanel("none")}
          />
        </div>
      )}

      {panel === "help" && (
        <div className="field-sheet" role="dialog" aria-modal="true">
          <div className="help-panel">
            <header className="site-editor-head">
              <div>
                <p className="eyebrow">How to use</p>
                <h2>Premier Field</h2>
              </div>
              <button type="button" className="ghost-btn" onClick={() => setPanel("none")}>
                Close
              </button>
            </header>
            <ol className="help-list">
              <li>
                <strong>Track route</strong> while hunting suburbs. Keep Safari or the home-screen
                app open — iPhone only records GPS reliably while this screen is visible.
              </li>
              <li>
                Green lines show streets you have already driven. Amber is today’s live track.
              </li>
              <li>
                <strong>Log site</strong> when you introduce Premier Solutions on a build. Add
                contact, status, notes, and photos.
              </li>
              <li>
                Everything saves in this phone’s browser storage. Export a backup regularly.
              </li>
            </ol>
            <p className="muted">
              For always-on background “fog of streets” maps, pair this with{" "}
              <strong>Fog of World</strong> on the App Store. Use Premier Field as your site CRM.
            </p>
            <div className="help-actions">
              <button type="button" className="primary-btn" onClick={() => void handleExport()}>
                Export backup
              </button>
              <label className="ghost-btn file-label">
                Import backup
                <input
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImport(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <button type="button" className="danger-btn" onClick={() => void handleClearTracks()}>
                Clear routes
              </button>
            </div>
            <p className="muted small">
              Premier Solutions ·{" "}
              <a href="https://www.premiersolutions.co.nz" target="_blank" rel="noreferrer">
                premiersolutions.co.nz
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
