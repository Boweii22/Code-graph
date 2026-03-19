'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGraphStore } from '@/lib/store';
import { getJob, getGraph } from '@/lib/api';
import LoadingState from '@/components/LoadingState';
import StatsBar from '@/components/StatsBar';
import Legend from '@/components/Legend';
import NodeSidebar from '@/components/NodeSidebar';
import QueryBar from '@/components/QueryBar';
import ChatPanel from '@/components/ChatPanel';
import Toolbar from '@/components/Toolbar';
import type { Job } from '@/lib/types';

const GraphCanvas = dynamic(() => import('@/components/GraphCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-[#44445a] text-sm font-mono">Initializing graph…</div>
    </div>
  ),
});

const Minimap = dynamic(() => import('@/components/Minimap'), { ssr: false });

export default function GraphPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const { nodes, edges, setJob, setGraph } = useGraphStore();
  const [job, setJobState] = useState<Job | null>(null);
  const [error, setError] = useState('');
  const [legendOpen, setLegendOpen] = useState(false); // mobile drawer
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;
    setJob(jobId);

    const poll = async () => {
      try {
        const j = await getJob(jobId);
        setJobState(j);
        if (j.status === 'ready') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          const graphData = await getGraph(jobId);
          setGraph(graphData.nodes || [], graphData.edges || []);
        } else if (j.status === 'error') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setError(j.error || j.message || 'An error occurred');
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to fetch job status';
        setError(msg);
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 1500);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [jobId, setJob, setGraph]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="panel p-8 max-w-md w-full text-center">
          <p className="text-[#f87171] font-semibold mb-2">Analysis failed</p>
          <p className="text-sm text-[#8888aa] break-words">{error}</p>
          <a href="/" className="inline-block mt-4 px-4 py-2 rounded bg-[#5b4dff] text-white text-sm font-semibold hover:bg-[#7060ff] transition-colors">
            Try another repo
          </a>
        </div>
      </div>
    );
  }

  if (!job || job.status !== 'ready') {
    return job ? <LoadingState job={job} /> : (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#44445a] font-mono text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0a0f]">
      <StatsBar onMenuClick={() => setLegendOpen(true)} />

      <div className="flex flex-1 overflow-hidden relative">

        {/* ── LEFT SIDEBAR: hidden on mobile, visible md+ ── */}
        <div className="hidden md:block flex-shrink-0">
          <Legend />
        </div>

        {/* ── MOBILE LEGEND DRAWER ── */}
        <AnimatePresence>
          {legendOpen && (
            <>
              {/* backdrop */}
              <motion.div
                key="legend-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40 md:hidden"
                onClick={() => setLegendOpen(false)}
              />
              {/* drawer */}
              <motion.div
                key="legend-drawer"
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="fixed left-0 top-0 h-full z-50 md:hidden flex flex-col"
                style={{ width: 240 }}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a3a] bg-[#0a0a0f]">
                  <span className="text-xs font-mono text-[#8888aa]">Explorer</span>
                  <button onClick={() => setLegendOpen(false)} className="text-[#44445a] hover:text-[#f0f0ff]">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Legend />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── MAIN CANVAS AREA ── */}
        {/* pb-[52px] on mobile reserves space for fixed QueryBar */}
        <div className="flex-1 flex flex-col relative overflow-hidden min-w-0 pb-[52px] md:pb-0">
          <div className="flex-1 relative overflow-hidden">
            <GraphCanvas nodes={nodes} edges={edges} />
            <Toolbar />
            {/* Minimap — hidden on mobile */}
            <div className="hidden sm:block">
              <Minimap nodes={nodes} edges={edges} />
            </div>
          </div>

          {/* Chat + Query stack */}
          <div className="relative flex-shrink-0">
            <ChatPanel />
            <QueryBar />
          </div>
        </div>

        {/* ── RIGHT SIDEBAR: slides in from right on desktop, bottom sheet on mobile ── */}
        <NodeSidebar />
      </div>
    </div>
  );
}
