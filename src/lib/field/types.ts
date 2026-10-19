export type SiteStatus =
  | "prospect"
  | "introduced"
  | "plans_requested"
  | "quoted"
  | "won"
  | "lost"
  | "follow_up";

export type ProjectType = "new_build" | "renovation" | "commercial" | "other";

export type LatLng = {
  lat: number;
  lng: number;
};

export type TrackPoint = LatLng & {
  t: number;
  accuracy?: number;
};

export type RouteTrack = {
  id: string;
  startedAt: string;
  endedAt?: string;
  points: TrackPoint[];
};

export type SitePhoto = {
  id: string;
  mimeType: string;
  dataUrl: string;
  caption?: string;
  createdAt: string;
};

export type SiteVisit = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: SiteStatus;
  projectType: ProjectType;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  company: string;
  notes: string;
  nextFollowUp: string;
  photos: SitePhoto[];
  createdAt: string;
  updatedAt: string;
  visitedAt: string;
};

export const SITE_STATUS_LABELS: Record<SiteStatus, string> = {
  prospect: "Prospect",
  introduced: "Introduced",
  plans_requested: "Plans requested",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost / closed",
  follow_up: "Follow up",
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  new_build: "New build",
  renovation: "Renovation",
  commercial: "Commercial",
  other: "Other",
};

export const STATUS_COLORS: Record<SiteStatus, string> = {
  prospect: "#64748b",
  introduced: "#0f4c45",
  plans_requested: "#d97706",
  quoted: "#0369a1",
  won: "#047857",
  lost: "#b91c1c",
  follow_up: "#7c3aed",
};

export function createEmptySite(partial?: Partial<SiteVisit> & LatLng): SiteVisit {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "",
    address: "",
    lat: partial?.lat ?? 0,
    lng: partial?.lng ?? 0,
    status: "introduced",
    projectType: "new_build",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    company: "",
    notes: "",
    nextFollowUp: "",
    photos: [],
    createdAt: now,
    updatedAt: now,
    visitedAt: now,
    ...partial,
  };
}
