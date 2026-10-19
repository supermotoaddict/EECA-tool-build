import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { RouteTrack, SiteVisit } from "./types";

const DB_NAME = "premier-field";
const DB_VERSION = 1;

type FieldDB = DBSchema & {
  sites: {
    key: string;
    value: SiteVisit;
    indexes: { "by-visited": string; "by-updated": string };
  };
  tracks: {
    key: string;
    value: RouteTrack;
    indexes: { "by-started": string };
  };
};

let dbPromise: Promise<IDBPDatabase<FieldDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<FieldDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const sites = db.createObjectStore("sites", { keyPath: "id" });
        sites.createIndex("by-visited", "visitedAt");
        sites.createIndex("by-updated", "updatedAt");
        const tracks = db.createObjectStore("tracks", { keyPath: "id" });
        tracks.createIndex("by-started", "startedAt");
      },
    });
  }
  return dbPromise;
}

export async function listSites(): Promise<SiteVisit[]> {
  const db = await getDb();
  const all = await db.getAll("sites");
  return all.sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
}

export async function getSite(id: string): Promise<SiteVisit | undefined> {
  const db = await getDb();
  return db.get("sites", id);
}

export async function saveSite(site: SiteVisit): Promise<void> {
  const db = await getDb();
  await db.put("sites", { ...site, updatedAt: new Date().toISOString() });
}

export async function deleteSite(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("sites", id);
}

export async function listTracks(): Promise<RouteTrack[]> {
  const db = await getDb();
  const all = await db.getAll("tracks");
  return all.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function saveTrack(track: RouteTrack): Promise<void> {
  const db = await getDb();
  await db.put("tracks", track);
}

export async function deleteTrack(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("tracks", id);
}

export async function clearAllTracks(): Promise<void> {
  const db = await getDb();
  await db.clear("tracks");
}

export type FieldBackup = {
  version: 1;
  exportedAt: string;
  sites: SiteVisit[];
  tracks: RouteTrack[];
};

export async function exportBackup(): Promise<FieldBackup> {
  const [sites, tracks] = await Promise.all([listSites(), listTracks()]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sites,
    tracks,
  };
}

export async function importBackup(backup: FieldBackup): Promise<{ sites: number; tracks: number }> {
  if (!backup || backup.version !== 1) {
    throw new Error("Unsupported backup format");
  }
  const db = await getDb();
  const tx = db.transaction(["sites", "tracks"], "readwrite");
  for (const site of backup.sites ?? []) {
    await tx.objectStore("sites").put(site);
  }
  for (const track of backup.tracks ?? []) {
    await tx.objectStore("tracks").put(track);
  }
  await tx.done;
  return {
    sites: backup.sites?.length ?? 0,
    tracks: backup.tracks?.length ?? 0,
  };
}
