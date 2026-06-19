'use client';

import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

interface AdminEditButtonProps {
  policyId: string;
}

export function AdminEditButton({ policyId }: AdminEditButtonProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role_id')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            const { data: role } = await supabase
              .from('roles')
              .select('name')
              .eq('id', profile.role_id)
              .single();
            
            setIsAdmin(role?.name === 'admin');
          }
        }
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
