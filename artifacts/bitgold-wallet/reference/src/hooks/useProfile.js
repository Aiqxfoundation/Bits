import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const ensure = useCallback(async () => {
    try {
      let referralCode = '';
      try { referralCode = localStorage.getItem('btg_referral_code') || ''; } catch (e) {}
      const res = await base44.functions.invoke('ensureProfile', { referral_code: referralCode });
      if (res.data && res.data.profile) {
        setProfile(res.data.profile);
      }
    } catch (e) {
      console.error('ensureProfile failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { ensure(); }, [ensure]);

  const reload = useCallback(async () => {
    try {
      const res = await base44.entities.UserProfile.filter({}, { limit: 1, sort: '-created_date' });
      if (res.items && res.items[0]) setProfile(res.items[0]);
    } catch (e) {
      console.error('reload failed', e);
    }
  }, []);

  return { profile, loading, reload, setProfile };
}