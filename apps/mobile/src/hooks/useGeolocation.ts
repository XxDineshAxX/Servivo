import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import type { GeoPoint } from '@servivo/types';

interface GeolocationState {
  location: GeoPoint | null;
  error: string | null;
  loading: boolean;
}

/**
 * Mobile geolocation hook using expo-location.
 * Requests foreground permission, then watches for updates.
 */
export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ location: null, error: 'Location permission denied.', loading: false });
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setState({
        location: { lat: current.coords.latitude, lng: current.coords.longitude },
        error: null,
        loading: false,
      });

      subscriber = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 15_000, distanceInterval: 20 },
        (loc) => {
          setState({
            location: { lat: loc.coords.latitude, lng: loc.coords.longitude },
            error: null,
            loading: false,
          });
        },
      );
    })();

    return () => {
      subscriber?.remove();
    };
  }, []);

  return state;
}
