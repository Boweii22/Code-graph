'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { createJob } from '@/lib/api';
import { useGraphStore } from '@/lib/store';

const GITHUB_REGEX = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/.*)?$/;

const EXAMPLE_REPOS = [
  { label: 'FastAPI', url: 'https://github.com/tiangolo/fastapi' },
  { label: 'Django', url: 'https://github.com/django/django' },
  { label: 'Lodash', url: 'https://github.com/lodash/lodash' },
  { label: 'Express', url: 'https://github.com/expressjs/express' },
];

export default function RepoInput() {
  const router = useRouter();
  const setJob = useGraphStore((s) => s.setJob);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (repoUrl: string) => {
      const trimmed = repoUrl.trim();
      if (!GITHUB_REGEX.test(trimmed)) {
        setError('Please enter a valid GitHub repository URL.');
        return;
      }
      setError('');
      setLoading(true);
      try {
        const job = await createJob(trimmed);
        setJob(job.job_id, trimmed);
        router.push(`/graph/${job.job_id}`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to start analysis';
        setError(msg);
        setLoading(false);
      }
    },
    [router, setJob]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="relative z-10 w-full max-w-2xl mx-auto mt-4"
    >
      {/* Main input row */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(url)}
            placeholder="https://github.com/tiangolo/fastapi"
            className="w-full h-12 px-4 rounded-lg bg-[#111118] border border-[#2a2a3a] text-[#f0f0ff] font-mono text-sm placeholder-[#44445a] input-glow transition-all"
            disabled={loading}
          />
        </div>
        <button
          onClick={() => handleSubmit(url)}
          disabled={loading || !url.trim()}
          className="h-12 px-5 rounded-lg bg-[#5b4dff] hover:bg-[#7060ff] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              Analyze
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-2 text-sm text-[#f87171]"
        >
          <AlertCircle size={14} />
          {error}
        </motion.div>
      )}

      {/* Example repos */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-xs text-[#44445a]">Try these:</span>
        {EXAMPLE_REPOS.map((repo) => (
          <button
            key={repo.label}
            onClick={() => {
              setUrl(repo.url);
              handleSubmit(repo.url);
            }}
            disabled={loading}
            className="text-xs px-2 py-1 rounded border border-[#2a2a3a] bg-[#111118] text-[#8888aa] hover:text-[#f0f0ff] hover:border-[#5b4dff] transition-colors font-mono disabled:opacity-40"
          >
            {repo.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
