"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Loader2, X } from "lucide-react";

interface MapPickerProps {
  lat?: number | null;
  lng?: number | null;
  address?: string;
  onChange: (lat: number, lng: number, address: string) => void;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

// Egypt bounds
const EGYPT_CENTER = { lat: 30.0444, lng: 31.2357 };
const DEFAULT_ZOOM = 7;

export default function MapPicker({ lat, lng, address, onChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [currentAddress, setCurrentAddress] = useState(address || "");
  const [mounted, setMounted] = useState(false);

  // Dynamically import Leaflet (SSR-safe)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;
    if (leafletMapRef.current) return; // already initialized

    let map: unknown;
    let marker: unknown;

    import("leaflet").then((L) => {
      // Fix default icon paths for Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const initLat = lat || EGYPT_CENTER.lat;
      const initLng = lng || EGYPT_CENTER.lng;

      map = L.map(mapRef.current!).setView([initLat, initLng], lat ? 14 : DEFAULT_ZOOM);
      leafletMapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).addTo(map as any);

      // Place initial marker if coords exist
      if (lat && lng) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        marker = L.marker([lat, lng]).addTo(map as any);
        markerRef.current = marker;
      }

      // Click to place / move marker
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).on("click", async (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;

        if (markerRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (markerRef.current as any).setLatLng([clickLat, clickLng]);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          markerRef.current = L.marker([clickLat, clickLng]).addTo(map as any);
        }

        // Reverse geocode
        setGeocoding(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${clickLat}&lon=${clickLng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.display_name || `${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}`;
          setCurrentAddress(addr);
          onChange(clickLat, clickLng, addr);
        } catch {
          const addr = `${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}`;
          setCurrentAddress(addr);
          onChange(clickLat, clickLng, addr);
        } finally {
          setGeocoding(false);
        }
      });
    });

    return () => {
      if (leafletMapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (leafletMapRef.current as any).remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search + " Egypt")}&format=json&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: NominatimResult[] = await res.json();
      setSearchResults(data);
    } finally {
      setSearching(false);
    }
  };

  const selectResult = async (result: NominatimResult) => {
    const selLat = parseFloat(result.lat);
    const selLng = parseFloat(result.lon);

    setSearchResults([]);
    setSearch("");
    setCurrentAddress(result.display_name);
    onChange(selLat, selLng, result.display_name);

    if (leafletMapRef.current) {
      import("leaflet").then((L) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (leafletMapRef.current as any).setView([selLat, selLng], 15);
        if (markerRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (markerRef.current as any).setLatLng([selLat, selLng]);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          markerRef.current = L.marker([selLat, selLng]).addTo(leafletMapRef.current as any);
        }
      });
    }
  };

  if (!mounted) {
    return (
      <div className="h-72 bg-slate-100 rounded-xl flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search box */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9 pr-8"
              placeholder="Search address in Egypt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            />
            {search && (
              <button onClick={() => { setSearch(""); setSearchResults([]); }} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button type="button" onClick={handleSearch} disabled={searching} className="btn-secondary px-3">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[1000] mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {searchResults.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectResult(r)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 border-b border-slate-100 last:border-0 truncate"
              >
                <MapPin className="w-3 h-3 inline mr-2 text-blue-500" />
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200" style={{ height: 320 }}>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <div ref={mapRef} className="w-full h-full" />

        {geocoding && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-slate-600 flex items-center gap-1.5 shadow z-[500]">
            <Loader2 className="w-3 h-3 animate-spin" /> Getting address...
          </div>
        )}

        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-slate-500 shadow z-[500]">
          Click map to place pin
        </div>
      </div>

      {/* Selected address */}
      {currentAddress && (
        <div className="flex items-start gap-2 text-sm text-slate-700 bg-blue-50 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <span>{currentAddress}</span>
        </div>
      )}
    </div>
  );
}
