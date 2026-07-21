'use client';

import { useState } from 'react';
import { Share2, Mail } from 'lucide-react';

interface PolicyShareCardProps {
  title: string;
  url: string;
}

export function PolicyShareCard({ title, url }: PolicyShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'width=550,height=420');
  };

  const handleEmailShare = () => {
    const subject = `Check out this policy: ${title}`;
    const body = `I found this interesting policy on the Plastic Policy Database:\n\n${title}\n\n${url}`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleInstagramShare = () => {
    const text = `Check out this policy: ${title}\n\n${url}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    window.open('https://instagram.com', '_blank');
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-3">
      <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Share</h3>
      <div className="grid gap-2">
        <button
          onClick={handleLinkedInShare}
          className="w-full py-2 px-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
        >
          LinkedIn
        </button>
        <button
          onClick={handleEmailShare}
          className="w-full py-2 px-3 rounded-lg bg-slate-600 text-white text-sm font-semibold hover:bg-slate-700 transition flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Email
        </button>
        <button
          onClick={handleInstagramShare}
          className="w-full py-2 px-3 rounded-lg bg-pink-600 text-white text-sm font-semibold hover:bg-pink-700 transition flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Instagram
        </button>
        <button
          onClick={handleCopyUrl}
          className={`w-full py-2 px-3 rounded-lg text-sm font-semibold transition ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-ink text-white hover:bg-ink/90'
          }`}
        >
          {copied ? '✓ Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
