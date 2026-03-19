'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import type { Job } from '@/lib/types';

interface Props {
  job: Job;
}

const STEPS = [
  { key: 'cloning',   label: 'Cloning repository',        threshold: 10 },
  { key: 'parsing',   label: 'Parsing AST',               threshold: 25 },
  { key: 'building',  label: 'Building knowledge graph',  threshold: 50 },
  { key: 'storing',   label: 'Storing in Neo4j',          threshold: 65 },
  { key: 'embedding', label: 'Generating embeddings',     threshold: 80 },
  { key: 'ready',     label: 'Ready!',                    threshold: 100 },
];

export default function LoadingState({ job }: Props) {
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    if (job.node_count > displayCount) {
      const diff = job.node_count - displayCount;
      const step = Math.max(1, Math.floor(diff / 20));
      const timer = setInterval(() => {
        setDisplayCount((c) => Math.min(c + step, job.node_count));
      }, 50);
      return () => clearInterval(timer);
    }
  }, [job.node_count, displayCount]);

  const completedIdx = STEPS.findIndex((s) => job.progress < s.threshold) - 1;

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center z-50">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(91,77,255,0.1) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#111118] border border-[#2a2a3a] mb-4">
            <Loader2 size={22} className="text-[#5b4dff] animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-[#f0f0ff] mb-1">Building your knowledge graph</h2>
          <p className="text-sm text-[#8888aa]">{job.message}</p>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#1a1a24] rounded-full overflow-hidden mb-8">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #5b4dff, #38bdf8)' }}
            animate={{ width: `${job.progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isDone = i <= completedIdx;
            const isActive = i === completedIdx + 1;
            return (
              <div
                key={step.key}
                className="flex items-center gap-3 text-sm"
              >
                <div className="flex-shrink-0">
                  {isDone ? (
                    <CheckCircle size={16} className="text-[#00d4a0]" />
                  ) : isActive ? (
                    <Loader2 size={16} className="text-[#5b4dff] animate-spin" />
                  ) : (
                    <Circle size={16} className="text-[#2a2a3a]" />
                  )}
                </div>
                <span
                  className={
                    isDone
                      ? 'text-[#8888aa] line-through'
                      : isActive
                      ? 'text-[#f0f0ff] font-medium'
                      : 'text-[#44445a]'
                  }
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live node count */}
        <AnimatePresence>
          {displayCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 rounded-lg bg-[#111118] border border-[#2a2a3a] text-center"
            >
              <div className="text-3xl font-bold font-mono text-[#5b4dff]">{displayCount}</div>
              <div className="text-xs text-[#8888aa] mt-1">nodes discovered</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
