import { useState, useEffect } from 'react';
import type { GeoPoint } from '@servivo/types';

interface GeolocationState {
  location: GeoPoint | null;
  error: string | null;
  loading: boolean;
}

/**
 * Hook to get and watch the user's current GPS position.
 * Requests high-accuracy mode for better results on mobile.
 */
export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ location: null, error: 'Geolocation is not supported.', loading: false });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 30_000,
    };

    const onSuccess = (pos: GeolocationPosition) => {
      setState({
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        error: null,
        loading: false,
      });
    };

    const onError = (err: GeolocationPositionError) => {
      setState({ location: null, error: err.message, loading: false });
    };

    // Get initial position immediately
    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

    // Then watch for changes
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
