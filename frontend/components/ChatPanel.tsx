'use client';

import { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MessageSquare, Network } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useGraphStore } from '@/lib/store';
import { queryGraph as queryGraphApi } from '@/lib/api';

export default function ChatPanel() {
  const chatOpen = useGraphStore((s) => s.chatOpen);
  const chatHistory = useGraphStore((s) => s.chatHistory);
  const setChatOpen = useGraphStore((s) => s.setChatOpen);
  const clearChat = useGraphStore((s) => s.clearChat);
  const setHighlight = useGraphStore((s) => s.setHighlight);
  const addChatEntry = useGraphStore((s) => s.addChatEntry);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (!chatOpen || chatHistory.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="chat-panel"
        initial={{ y: 300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 300, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="absolute bottom-0 left-0 right-0 z-30 glass border-t border-[#2a2a3a] flex flex-col"
        style={{ maxHeight: 'min(45vh, 380px)', minHeight: '160px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a3a] flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-[#5b4dff]" />
            <span className="text-xs font-semibold text-[#f0f0ff]">Claude AI Answers</span>
            <span className="text-xs font-mono text-[#44445a]">({chatHistory.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="text-xs text-[#44445a] hover:text-[#8888aa] transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setChatOpen(false)}
              className="w-6 h-6 flex items-center justify-center text-[#44445a] hover:text-[#f0f0ff] transition-colors rounded hover:bg-[#1a1a24]"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {chatHistory.map((entry, i) => (
            <div key={i} className="space-y-3">
              {/* Question */}
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#5b4dff] flex-shrink-0 flex items-center justify-center mt-0.5">
                  <span className="text-[9px] text-white font-bold">Q</span>
                </div>
                <p className="text-sm text-[#f0f0ff] font-medium">{entry.question}</p>
              </div>

              {/* Answer */}
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#1a1a24] border border-[#2a2a3a] flex-shrink-0 flex items-center justify-center mt-0.5">
                  <span className="text-[9px] text-[#5b4dff] font-bold">A</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="prose-dark text-sm">
                    <ReactMarkdown>{entry.answer}</ReactMarkdown>
                  </div>

                  {/* Retrieved subgraph info */}
                  {entry.nodeIds.length > 0 && (
                    <button
                      onClick={() => setHighlight(entry.nodeIds)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-[#44445a] hover:text-[#5b4dff] transition-colors"
                    >
                      <Network size={11} />
                      Retrieved subgraph: {entry.nodeIds.length} nodes, {entry.edgeIds.length} edges
                      — click to highlight
                    </button>
                  )}

                  {/* Follow-up suggestions */}
                  {entry.followups.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.followups.map((q, j) => (
                        <FollowupChip key={j} question={q} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function FollowupChip({ question }: { question: string }) {
  const addChatEntry = useGraphStore((s) => s.addChatEntry);
  const jobId = useGraphStore((s) => s.jobId);
  const setHighlight = useGraphStore((s) => s.setHighlight);

  const handleClick = async () => {
    if (!jobId) return;
    try {
      const result = await queryGraphApi(question, jobId);
      if (result.retrieved_nodes.length > 0) setHighlight(result.retrieved_nodes);
      addChatEntry({
        question,
        answer: result.answer,
        nodeIds: result.retrieved_nodes,
        edgeIds: result.retrieved_edges,
        followups: result.suggested_followups,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-xs px-3 py-1.5 rounded-full border border-[#2a2a3a] bg-[#111118] text-[#8888aa] hover:text-[#f0f0ff] hover:border-[#5b4dff] transition-colors text-left max-w-[220px] truncate"
    >
      {question}
    </button>
  );
}
