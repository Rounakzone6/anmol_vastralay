'use client';

import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

export function GlobalNotificationToasts() {
  const router = useRouter();
  
  // Keep track of the IDs of notifications we've seen.
  // Using a ref so we can update it without causing re-renders that re-trigger the effect.
  const seenIds = useRef<Set<string> | null>(null);
  
  // Set up polling every 30 seconds
  const { data: updates, isSuccess } = trpc.dashboard.getUpdates.useQuery(
    { filter: 'TODAY' },
    { refetchInterval: 30000, refetchOnWindowFocus: true }
  );

  useEffect(() => {
    if (!isSuccess || !updates || updates.length === 0) return;

    // Initial load: just set the baseline, don't show toasts
    if (seenIds.current === null) {
      seenIds.current = new Set(updates.map((u: any) => u.id));
      return;
    }

    // Find all updates that are newer than our last seen baseline
    const newUpdates = updates.filter(
      (update: any) => !seenIds.current!.has(update.id)
    );

    if (newUpdates.length > 0) {
      // Add new IDs to the set
      newUpdates.forEach((u: any) => seenIds.current!.add(u.id));

      // Show toast for the new update(s)
      // If there are many, just show one summary toast to avoid spam
      if (newUpdates.length > 2) {
        toast('New Notifications', {
          description: `You have ${newUpdates.length} new updates.`,
          icon: <Bell size={16} className="text-violet-600" />,
          action: {
            label: 'View',
            onClick: () => router.push('/updates'),
          },
        });
      } else {
        newUpdates.forEach((update: any) => {
          toast(update.title, {
            description: update.message,
            icon: <Bell size={16} className="text-violet-600" />,
            action: {
              label: 'View',
              onClick: () => router.push('/updates'),
            },
          });
        });
      }
    }
  }, [updates, isSuccess, router]);

  return null;
}
