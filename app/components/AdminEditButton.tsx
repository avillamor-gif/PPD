'use client';

import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface AdminEditButtonProps {
  policyId: string;
}

export function AdminEditButton({ policyId }: AdminEditButtonProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          setChecking(false);
          return;
        }

        const res = await fetch('/api/auth/check-admin', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        const data = await res.json();
        console.log('AdminEditButton - Admin check:', data);
        setIsAdmin(data.isAdmin === true);
      } catch (err) {
        console.error('Error checking admin status:', err);
      } finally {
        setChecking(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  if (checking || !isAdmin) {
    return null;
  }

  return (
    <Link
      href={`/admin/manage/${policyId}`}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean/10 text-ocean hover:bg-ocean/20 transition font-medium text-sm"
      title="Edit this policy"
    >
      <Pencil className="w-4 h-4" />
      Edit Policy
    </Link>
  );
}
