import React, { useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { NearbyAvailablePro, GeoPoint } from '@servivo/types';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

interface MapViewProps {
  center: GeoPoint;
  pros: NearbyAvailablePro[];
  onProClick?: (pro: NearbyAvailablePro) => void;
}

/**
 * Mapbox GL map showing:
 *  - A blue dot for the consumer's location
 *  - Numbered markers for each nearby available pro
 */
export function MapView({ center, pros, onProClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
      'top-right',
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly to new center when consumer moves
  useEffect(() => {
    mapRef.current?.flyTo({ center: [center.lng, center.lat], speed: 0.8 });
  }, [center.lat, center.lng]);

  // Re-render pro markers when list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    pros.forEach((pro, idx) => {
      const el = document.createElement('div');
      el.className =
        'w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-lg cursor-pointer border-2 border-white';
      el.textContent = String(idx + 1);
      el.title = pro.proName;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
        `<div class="p-2 min-w-[140px]">
          <p class="font-semibold text-sm">${pro.proName}</p>
          <p class="text-xs text-gray-500">${pro.distanceKm.toFixed(1)} km away</p>
          <p class="text-xs text-gray-500">⭐ ${pro.rating.toFixed(1)}</p>
          <p class="text-xs text-indigo-600 mt-1">Available in ${Math.round((pro.nextAvailableAt - Date.now()) / 60000)} min</p>
        </div>`,
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pro.lng, pro.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => onProClick?.(pro));

      markersRef.current.push(marker);
    });
  }, [pros, onProClick]);

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />;
}
