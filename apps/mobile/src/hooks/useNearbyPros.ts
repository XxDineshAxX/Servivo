import { useState, useEffect } from 'react';
import type { GeoPoint, NearbyAvailablePro, ProProfile, AvailabilitySlot } from '@servivo/types';
import { subscribeOnlinePros, fetchSoonAvailability } from '@servivo/firebase';
import { findAvailableProsNearby } from '@servivo/scheduling';

interface NearbyProsState {
  pros: NearbyAvailablePro[];
  loading: boolean;
  error: string | null;
}

export function useNearbyPros(consumerLocation: GeoPoint | null): NearbyProsState {
  const [state, setState] = useState<NearbyProsState>({
    pros: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!consumerLocation) return;

    setState((s) => ({ ...s, loading: true }));
    let onlinePros: ProProfile[] = [];

    const processUpdate = async () => {
      try {
        const slots: AvailabilitySlot[] = await fetchSoonAvailability();
        const sorted = findAvailableProsNearby(consumerLocation, onlinePros, slots);
        setState({ pros: sorted, loading: false, error: null });
      } catch (e) {
        setState({ pros: [], loading: false, error: (e as Error).message });
      }
    };

    const unsubscribe = subscribeOnlinePros((pros) => {
      onlinePros = pros;
      processUpdate();
    });

    return unsubscribe;
  }, [consumerLocation?.lat, consumerLocation?.lng]);

  return state;
}
