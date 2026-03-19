'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { useGraphStore } from '@/lib/store';
import { queryGraph } from '@/lib/api';

const PLACEHOLDER_QUESTIONS = [
  'Who calls validate_token?',
  'What does the AuthService class do?',
  'Show me all functions that handle HTTP requests.',
  'What are the main dependencies of this codebase?',
  'Which functions have the most callers?',
  'Explain the authentication flow.',
];

export default function QueryBar() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const jobId = useGraphStore((s) => s.jobId);
  const selectedNode = useGraphStore((s) => s.selectedNode);
  const edges = useGraphStore((s) => s.edges);
  const addChatEntry = useGraphStore((s) => s.addChatEntry);
  const setHighlight = useGraphStore((s) => s.setHighlight);

  // Cycle placeholder
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_QUESTIONS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async () => {
    if (!question.trim() || !jobId || loading) return;

    setLoading(true);
    try {
      // Build context: selected node + its neighbors
      let contextNodeIds: string[] | undefined;
      if (selectedNode) {
        const neighborIds = edges
          .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
          .flatMap((e) => [e.source, e.target]);
        contextNodeIds = [...new Set([selectedNode.id, ...neighborIds])];
      }

      const result = await queryGraph(question.trim(), jobId, contextNodeIds);

      // Highlight retrieved nodes
      if (result.retrieved_nodes.length > 0) {
        setHighlight(result.retrieved_nodes);
      }

      addChatEntry({
        question: question.trim(),
        answer: result.answer,
        nodeIds: result.retrieved_nodes,
        edgeIds: result.retrieved_edges,
        followups: result.suggested_followups,
      });

      setQuestion('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-[#2a2a3a] bg-[#0a0a0f] flex-shrink-0 flex-wrap sm:flex-nowrap">
      <div className="flex-1 relative">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={`Ask anything: "${PLACEHOLDER_QUESTIONS[placeholderIdx]}"`}
          disabled={loading || !jobId}
          className="w-full h-9 px-4 rounded-lg bg-[#111118] border border-[#2a2a3a] text-sm text-[#f0f0ff] placeholder-[#44445a] font-sans focus:outline-none focus:border-[#5b4dff] transition-colors disabled:opacity-40"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading || !question.trim() || !jobId}
        className="h-9 px-4 rounded-lg bg-[#5b4dff] hover:bg-[#7060ff] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ArrowUp size={14} />
        )}
        {loading ? 'Thinking…' : 'Ask Claude'}
      </button>
    </div>
  );
}
