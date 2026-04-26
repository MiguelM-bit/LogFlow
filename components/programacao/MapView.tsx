"use client";

import { useEffect, useRef, useState } from "react";
import type { ProgramacaoCargaComSLA } from "@/types";
import { geocodeAddressMock } from "@/services/geoService";

interface MapViewProps {
  cargas: ProgramacaoCargaComSLA[];
  highlightedId: string | null;
  onSelectLoad: (carga: ProgramacaoCargaComSLA) => void;
  onHover: (cargaId: string | null) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  critico: "#ef4444",
  alerta: "#f59e0b",
  ok: "#3b82f6",
};

export function MapView({ cargas, highlightedId, onSelectLoad, onHover }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  // Initialise the map once
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    let disposed = false;

    // Dynamic import to avoid SSR issues
    void import("leaflet").then((L) => {
      const container = mapRef.current;
      if (!container || disposed || leafletMapRef.current) {
        return;
      }

      // Fix Leaflet default icon path in Next.js
      // @ts-expect-error – private leaflet property
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // React can remount before Leaflet cleanup finishes in dev; clear the stale marker id.
      delete (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;

      const map = L.map(container, {
        center: [-23.55, -46.63],
        zoom: 9,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (disposed) {
        map.remove();
        return;
      }

      leafletMapRef.current = map;
      setMapReady(true);
    });

    return () => {
      disposed = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      if (mapRef.current) {
        delete (mapRef.current as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
      }

      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when cargas change
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;

    void import("leaflet").then((L) => {
      const map = leafletMapRef.current;
      if (!map) return;

      // Remove old markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      const activeCar = cargas.filter((c) => c.status_viagem !== "concluida");

      activeCar.forEach((carga) => {
        const color = PRIORITY_COLORS[carga.prioridade] ?? "#3b82f6";
        const isHighlighted = highlightedId === carga.id;

        // Create SVG icon
        const size = isHighlighted ? 36 : 28;
        const svgIcon = L.divIcon({
          className: "",
          html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="${isHighlighted ? 3 : 2}"/>
            <circle cx="12" cy="12" r="4" fill="white"/>
          </svg>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const point = geocodeAddressMock(carga.origem);
        const marker = L.marker([point.lat, point.lng], { icon: svgIcon })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:160px">
              <strong style="font-size:13px">${carga.cliente}</strong>
              <br/><span style="font-size:11px;color:#64748b">${carga.origem} → ${carga.destino}</span>
              <br/><span style="font-size:11px;color:${color};font-weight:600">${carga.prioridade.toUpperCase()}</span>
            </div>`
          );

        marker.on("click", () => onSelectLoad(carga));
        marker.on("mouseover", () => onHover(carga.id));
        marker.on("mouseout", () => onHover(null));

        markersRef.current.set(carga.id, marker);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargas, highlightedId, mapReady]);

  // Pan to highlighted marker
  useEffect(() => {
    if (!highlightedId || !leafletMapRef.current) return;
    const marker = markersRef.current.get(highlightedId);
    if (marker) {
      leafletMapRef.current.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
    }
  }, [highlightedId]);

  return (
    <div className="relative z-0 h-full w-full overflow-hidden rounded-2xl border border-slate-200">
      {/* Leaflet CSS */}
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        .leaflet-container { font-family: inherit; }
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .leaflet-popup-tip-container { display: none; }
      `}</style>

      {/* Map container */}
      <div ref={mapRef} className="h-full w-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
        <p className="text-xs font-semibold text-slate-600 mb-0.5">Prioridade</p>
        {[
          { color: "#ef4444", label: "Crítico" },
          { color: "#f59e0b", label: "Alerta" },
          { color: "#3b82f6", label: "Normal" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
