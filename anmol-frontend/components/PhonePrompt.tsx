'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function PhonePrompt() {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const [hasPrompted, setHasPrompted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated && user && !user.phone && !hasPrompted) {
      // Check local storage to prevent showing it across multiple sessions if they dismissed it
      const alreadyPrompted = localStorage.getItem('anmol_phone_prompted');
      
      if (!alreadyPrompted) {
        toast('Phone Number Missing', {
          description: 'Please add your phone number in your profile for seamless delivery updates and AI Assistant support!',
          action: {
            label: 'Update Profile',
            onClick: () => router.push('/profile'),
          },
          duration: 8000,
          onDismiss: () => {
            localStorage.setItem('anmol_phone_prompted', 'true');
          },
          onAutoClose: () => {
            localStorage.setItem('anmol_phone_prompted', 'true');
          }
        });
        setHasPrompted(true);
      }
    }
  }, [isAuthenticated, user, isHydrated, hasPrompted, router]);

  return null;
}
