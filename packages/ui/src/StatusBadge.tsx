import React from 'react';
import type { BookingStatus } from '@servivo/types';

const statusConfig: Record<BookingStatus, { label: string; classes: string }> = {
  pending:     { label: 'Pending',      classes: 'bg-yellow-100 text-yellow-800' },
  accepted:    { label: 'Accepted',     classes: 'bg-blue-100 text-blue-800' },
  rejected:    { label: 'Rejected',     classes: 'bg-red-100 text-red-800' },
  in_progress: { label: 'In Progress',  classes: 'bg-indigo-100 text-indigo-800' },
  completed:   { label: 'Completed',    classes: 'bg-green-100 text-green-800' },
  cancelled:   { label: 'Cancelled',    classes: 'bg-gray-100 text-gray-600' },
};

interface StatusBadgeProps {
  status: BookingStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, classes } = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
