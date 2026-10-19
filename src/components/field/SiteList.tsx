"use client";

import { useMemo, useState } from "react";
import type { SiteVisit } from "@/lib/field/types";
import {
  PROJECT_TYPE_LABELS,
  SITE_STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/field/types";

type Props = {
  sites: SiteVisit[];
  onSelect: (id: string) => void;
  onClose: () => void;
};

export default function SiteList({ sites, onSelect, onClose }: Props) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sites.filter((site) => {
      if (status !== "all" && site.status !== status) return false;
      if (!needle) return true;
      const hay = [
        site.name,
        site.address,
        site.company,
        site.contactName,
        site.notes,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [sites, q, status]);

  return (
    <div className="site-list-panel">
      <header className="site-editor-head">
        <div>
          <p className="eyebrow">Visit database</p>
          <h2>
            {filtered.length} site{filtered.length === 1 ? "" : "s"}
          </h2>
        </div>
        <button type="button" className="ghost-btn" onClick={onClose}>
          Close
        </button>
      </header>

      <div className="list-filters">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, suburb, builder, notes…"
          aria-label="Search sites"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
          <option value="all">All statuses</option>
          {Object.entries(SITE_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No sites match. Drop a pin on the map when you introduce yourself on site.</p>
      ) : (
        <ul className="site-cards">
          {filtered.map((site) => (
            <li key={site.id}>
              <button type="button" className="site-card" onClick={() => onSelect(site.id)}>
                <span
                  className="status-dot"
                  style={{ background: STATUS_COLORS[site.status] }}
                  aria-hidden
                />
                <span className="site-card-body">
                  <strong>{site.name || "Untitled site"}</strong>
                  <span>
                    {SITE_STATUS_LABELS[site.status]} · {PROJECT_TYPE_LABELS[site.projectType]}
                  </span>
                  <span className="muted">
                    {[site.address, site.company].filter(Boolean).join(" · ") ||
                      new Date(site.visitedAt).toLocaleDateString("en-NZ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
