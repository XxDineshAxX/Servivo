import React from 'react';
import type { BookingStatus } from '@servivo/types';

const statusConfig: Record<BookingStatus, { label: string; classes: string }> = {
  pending:     { label: 'Pending',     classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  accepted:    { label: 'Accepted',    classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  rejected:    { label: 'Rejected',    classes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  in_progress: { label: 'In Progress', classes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' },
  completed:   { label: 'Completed',   classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  cancelled:   { label: 'Cancelled',   classes: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
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
