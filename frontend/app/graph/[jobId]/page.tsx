'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
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

// Cytoscape must be client-only (no SSR)
const GraphCanvas = dynamic(() => import('@/components/GraphCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-[#44445a] text-sm font-mono">Initializing graph…</div>
    </div>
  ),
});

export default function GraphPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const { nodes, edges, setJob, setGraph } = useGraphStore();
  const [job, setJobState] = useState<Job | null>(null);
  const [error, setError] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;
    setJob(jobId);

    // Poll job status
    const poll = async () => {
      try {
        const j = await getJob(jobId);
        setJobState(j);

        if (j.status === 'ready') {
          // Stop polling, fetch graph
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

    poll(); // immediate first poll
    pollingRef.current = setInterval(poll, 1500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobId, setJob, setGraph]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="panel p-8 max-w-md text-center">
          <p className="text-[#f87171] font-semibold mb-2">Analysis failed</p>
          <p className="text-sm text-[#8888aa]">{error}</p>
          <a
            href="/"
            className="inline-block mt-4 px-4 py-2 rounded bg-[#5b4dff] text-white text-sm font-semibold hover:bg-[#7060ff] transition-colors"
          >
            Try another repo
          </a>
        </div>
      </div>
    );
  }

  // Loading state
  if (!job || job.status !== 'ready') {
    return job ? <LoadingState job={job} /> : (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#44445a] font-mono text-sm">Loading…</div>
      </div>
    );
  }

  // Graph explorer
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0a0f]">
      <StatsBar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left sidebar */}
        <Legend />

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Graph canvas */}
          <div className="flex-1 relative overflow-hidden">
            <GraphCanvas nodes={nodes} edges={edges} />
            <Toolbar />
          </div>

          {/* Query bar + Chat panel stack */}
          <div className="relative flex-shrink-0">
            <ChatPanel />
            <QueryBar />
          </div>
        </div>

        {/* Right sidebar — absolute overlay anchored to the flex row */}
        <NodeSidebar />
      </div>
    </div>
  );
}
