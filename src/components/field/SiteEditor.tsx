"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { SiteVisit } from "@/lib/field/types";
import {
  PROJECT_TYPE_LABELS,
  SITE_STATUS_LABELS,
  type ProjectType,
  type SiteStatus,
} from "@/lib/field/types";

type Props = {
  site: SiteVisit;
  onChange: (site: SiteVisit) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function SiteEditor({ site, onChange, onSave, onDelete, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busyPhoto, setBusyPhoto] = useState(false);

  function patch<K extends keyof SiteVisit>(key: K, value: SiteVisit[K]) {
    onChange({ ...site, [key]: value });
  }

  async function onPhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusyPhoto(true);
    try {
      const added = [];
      for (const file of files.slice(0, 6)) {
        if (!file.type.startsWith("image/")) continue;
        const dataUrl = await fileToDataUrl(file);
        added.push({
          id: crypto.randomUUID(),
          mimeType: file.type,
          dataUrl,
          createdAt: new Date().toISOString(),
        });
      }
      onChange({ ...site, photos: [...site.photos, ...added].slice(0, 12) });
    } finally {
      setBusyPhoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    onSave();
  }

  return (
    <form className="site-editor" onSubmit={onSubmit}>
      <header className="site-editor-head">
        <div>
          <p className="eyebrow">Site visit</p>
          <h2>{site.name.trim() || "New construction site"}</h2>
        </div>
        <button type="button" className="ghost-btn" onClick={onClose} aria-label="Close">
          Close
        </button>
      </header>

      <label>
        Site / street name
        <input
          required
          value={site.name}
          onChange={(e) => patch("name", e.target.value)}
          placeholder="e.g. 42 Oak Avenue — frames up"
        />
      </label>

      <label>
        Address / suburb
        <input
          value={site.address}
          onChange={(e) => patch("address", e.target.value)}
          placeholder="Suburb, city, or full address"
        />
      </label>

      <div className="field-row">
        <label>
          Status
          <select
            value={site.status}
            onChange={(e) => patch("status", e.target.value as SiteStatus)}
          >
            {Object.entries(SITE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Project type
          <select
            value={site.projectType}
            onChange={(e) => patch("projectType", e.target.value as ProjectType)}
          >
            {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Builder / company
        <input
          value={site.company}
          onChange={(e) => patch("company", e.target.value)}
          placeholder="Company on site"
        />
      </label>

      <div className="field-row">
        <label>
          Contact name
          <input
            value={site.contactName}
            onChange={(e) => patch("contactName", e.target.value)}
            placeholder="Who you met"
          />
        </label>
        <label>
          Phone
          <input
            value={site.contactPhone}
            onChange={(e) => patch("contactPhone", e.target.value)}
            inputMode="tel"
            placeholder="02…"
          />
        </label>
      </div>

      <label>
        Email
        <input
          value={site.contactEmail}
          onChange={(e) => patch("contactEmail", e.target.value)}
          inputMode="email"
          placeholder="for plans / quotes"
        />
      </label>

      <label>
        Next follow-up
        <input
          type="date"
          value={site.nextFollowUp}
          onChange={(e) => patch("nextFollowUp", e.target.value)}
        />
      </label>

      <label>
        Notes
        <textarea
          rows={4}
          value={site.notes}
          onChange={(e) => patch("notes", e.target.value)}
          placeholder="Stage of build, who to ask for plans, competitors on site, quote deadline…"
        />
      </label>

      <div className="photo-block">
        <div className="photo-block-head">
          <span>Photos</span>
          <button type="button" className="text-btn" onClick={() => fileRef.current?.click()}>
            {busyPhoto ? "Adding…" : "Add photos"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            hidden
            onChange={onPhotos}
          />
        </div>
        {site.photos.length === 0 ? (
          <p className="muted">Site board, frames, or contact card — stored on this phone.</p>
        ) : (
          <ul className="photo-grid">
            {site.photos.map((photo) => (
              <li key={photo.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.dataUrl} alt={photo.caption || "Site photo"} />
                <button
                  type="button"
                  className="photo-remove"
                  onClick={() =>
                    onChange({
                      ...site,
                      photos: site.photos.filter((p) => p.id !== photo.id),
                    })
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="coords muted">
        Pin: {site.lat.toFixed(5)}, {site.lng.toFixed(5)}
      </p>

      <div className="site-editor-actions">
        <button type="submit" className="primary-btn">
          Save site
        </button>
        <button
          type="button"
          className="danger-btn"
          onClick={() => {
            if (confirm("Delete this site from your phone database?")) onDelete();
          }}
        >
          Delete
        </button>
      </div>
    </form>
  );
}
