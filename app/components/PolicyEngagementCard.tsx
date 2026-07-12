'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, Eye } from 'lucide-react';

interface PolicyEngagementCardProps {
  policyId: string;
}

export function PolicyEngagementCard({ policyId }: PolicyEngagementCardProps) {
  const [stats, setStats] = useState({ views: 0, helpful: 0 });
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return '';
    let id = sessionStorage.getItem('engagement_session_id');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('engagement_session_id', id);
    }
    return id;
  });

  // Fetch stats and record view on mount
  useEffect(() => {
    const recordEngagement = async () => {
      try {
        // Get current stats
        const statsRes = await fetch(`/api/policies/${policyId}/engagement`);
        const statsData = await statsRes.json();
        setStats(statsData);

        // Record a view
        await fetch(`/api/policies/${policyId}/engagement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            engagementType: 'view',
            sessionId,
          }),
        });

        // Check if user has already voted (stored in localStorage)
        const votedKey = `voted_${policyId}`;
        const hasVotedBefore = localStorage.getItem(votedKey) === 'true';
        setHasVoted(hasVotedBefore);
      } catch (error) {
        console.error('Error fetching engagement stats:', error);
      } finally {
        setLoading(false);
      }
    };

    recordEngagement();
  }, [policyId, sessionId]);

  const handleHelpfulClick = async () => {
    if (hasVoted) return;

    try {
      const res = await fetch(`/api/policies/${policyId}/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementType: 'helpful',
          sessionId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStats(data.stats);
        setHasVoted(true);
        localStorage.setItem(`voted_${policyId}`, 'true');
      }
    } catch (error) {
      console.error('Error recording helpful vote:', error);
    }
  };

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-4">
      <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Engagement</h3>
      <div className="space-y-3">
        <button
          onClick={handleHelpfulClick}
          disabled={hasVoted || loading}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold transition ${
            hasVoted
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-coral/10 text-coral hover:bg-coral/20'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          Helpful ({stats.helpful})
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-ink/60 border-t border-ink/10 pt-3">
        <Eye className="w-4 h-4" />
        <span>{stats.views} view{stats.views !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
