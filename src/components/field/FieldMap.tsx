"use client";

import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { LatLng, RouteTrack, SiteVisit } from "@/lib/field/types";
import { STATUS_COLORS, SITE_STATUS_LABELS } from "@/lib/field/types";
import { DEFAULT_CENTER } from "@/lib/field/geo";

import "leaflet/dist/leaflet.css";

type Props = {
  sites: SiteVisit[];
  tracks: RouteTrack[];
  livePoints: LatLng[];
  userPosition: LatLng | null;
  selectedSiteId: string | null;
  placingPin: boolean;
  onSelectSite: (id: string) => void;
  onMapClick: (coords: LatLng) => void;
  followUser: boolean;
};

function siteIcon(color: string) {
  return L.divIcon({
    className: "field-marker",
    html: `<span style="--pin:${color}"></span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -28],
  });
}

function MapEvents({
  placingPin,
  onMapClick,
}: {
  placingPin: boolean;
  onMapClick: (coords: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      if (!placingPin) return;
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FollowUser({
  position,
  enabled,
}: {
  position: LatLng | null;
  enabled: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || !position) return;
    map.panTo([position.lat, position.lng], { animate: true, duration: 0.4 });
  }, [enabled, position, map]);
  return null;
}

function FitOnSelect({
  site,
}: {
  site: SiteVisit | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!site) return;
    map.flyTo([site.lat, site.lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [site, map]);
  return null;
}

export default function FieldMap({
  sites,
  tracks,
  livePoints,
  userPosition,
  selectedSiteId,
  placingPin,
  onSelectSite,
  onMapClick,
  followUser,
}: Props) {
  const selected = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) ?? null,
    [sites, selectedSiteId]
  );

  const historicLines = useMemo(
    () =>
      tracks
        .filter((t) => t.points.length > 1)
        .map((t) => t.points.map((p) => [p.lat, p.lng] as [number, number])),
    [tracks]
  );

  const liveLine = useMemo(
    () => livePoints.map((p) => [p.lat, p.lng] as [number, number]),
    [livePoints]
  );

  const center = userPosition ?? selected ?? DEFAULT_CENTER;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      className="field-map"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
      />
      <MapEvents placingPin={placingPin} onMapClick={onMapClick} />
      <FollowUser position={userPosition} enabled={followUser} />
      <FitOnSelect site={selected} />

      {historicLines.map((line, i) => (
        <Polyline
          key={`hist-${i}`}
          positions={line}
          pathOptions={{
            color: "#0f4c45",
            weight: 4,
            opacity: 0.45,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      ))}

      {liveLine.length > 1 && (
        <Polyline
          positions={liveLine}
          pathOptions={{
            color: "#d97706",
            weight: 5,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      {sites.map((site) => (
        <Marker
          key={site.id}
          position={[site.lat, site.lng]}
          icon={siteIcon(STATUS_COLORS[site.status])}
          eventHandlers={{
            click: () => onSelectSite(site.id),
          }}
        >
          <Popup>
            <strong>{site.name || "Untitled site"}</strong>
            <br />
            {SITE_STATUS_LABELS[site.status]}
          </Popup>
        </Marker>
      ))}

      {userPosition && (
        <CircleMarker
          center={[userPosition.lat, userPosition.lng]}
          radius={8}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#0369a1",
            fillOpacity: 1,
          }}
        />
      )}
    </MapContainer>
  );
}
