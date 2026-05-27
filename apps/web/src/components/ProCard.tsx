import React from 'react';
import type { NearbyAvailablePro } from '@servivo/types';
import { Card, CardHeader, Button } from '@servivo/ui';

interface ProCardProps {
  pro: NearbyAvailablePro;
  rank: number;
  onBook: (pro: NearbyAvailablePro) => void;
  loading?: boolean;
}

export function ProCard({ pro, rank, onBook, loading }: ProCardProps) {
  const minutesAway = Math.round((pro.nextAvailableAt - Date.now()) / 60_000);

  return (
    <Card className="mb-3">
      <CardHeader
        title={pro.proName}
        subtitle={pro.serviceTypes.join(', ')}
        right={
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
            #{rank}
          </span>
        }
      />
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <span>📍 {pro.distanceKm.toFixed(1)} km</span>
        <span>⭐ {pro.rating.toFixed(1)}</span>
        <span>⏱ Available {minutesAway <= 0 ? 'now' : `in ${minutesAway} min`}</span>
      </div>
      <Button
        variant="primary"
        size="sm"
        className="w-full"
        onClick={() => onBook(pro)}
        loading={loading}
      >
        Book {pro.proName.split(' ')[0]}
      </Button>
    </Card>
  );
}
