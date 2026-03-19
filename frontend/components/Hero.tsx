'use client';

import { motion } from 'framer-motion';
import { GitBranch, Zap, Database } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
  }),
};

const stats = [
  { value: '4,200+', label: 'repos analyzed' },
  { value: '12', label: 'languages supported' },
  { value: 'Neo4j', label: 'powered graph DB' },
];

const steps = [
  {
    icon: <GitBranch size={20} className="text-[#00d4a0]" />,
    title: 'Paste URL',
    desc: 'Drop in any public GitHub repository URL.',
  },
  {
    icon: <Database size={20} className="text-[#a78bfa]" />,
    title: 'Graph builds',
    desc: 'AST parsing extracts functions, classes, and imports. Stored as a knowledge graph in Neo4j.',
  },
  {
    icon: <Zap size={20} className="text-[#38bdf8]" />,
    title: 'Ask anything',
    desc: 'Ask Claude about the code in plain English. GraphRAG retrieves the relevant subgraph first.',
  },
];

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center pt-28 pb-16 px-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-dots pointer-events-none" />

      {/* Radial gradient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(91,77,255,0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Hackathon badge */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2a2a3a] bg-[#111118] text-xs text-[#8888aa] mb-8 font-mono"
        >
          <span className="w-2 h-2 rounded-full bg-[#00d4a0] animate-pulse" />
          HackerNoon &ldquo;Proof of Usefulness&rdquo; Hackathon Submission
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Understand any
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #5b4dff 0%, #38bdf8 50%, #00d4a0 100%)',
            }}
          >
            codebase
          </span>{' '}
          in 30s.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-lg md:text-xl text-[#8888aa] max-w-2xl mx-auto mb-4 leading-relaxed"
        >
          Paste a GitHub repo. Get an interactive knowledge graph, call chains,
          and AI answers — powered by{' '}
          <span className="text-[#00d4a0] font-medium">Neo4j GraphRAG</span>.
        </motion.p>
      </div>

      {/* Stats row */}
      <motion.div
        custom={5}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative z-10 flex gap-8 mt-16 pt-8 border-t border-[#2a2a3a]"
      >
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-bold font-mono text-[#f0f0ff]">{s.value}</div>
            <div className="text-xs text-[#8888aa] mt-1">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* How it works */}
      <motion.div
        custom={6}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-3xl mx-auto w-full"
      >
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="panel p-5 text-left flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#1a1a24] flex items-center justify-center">
                {step.icon}
              </div>
              <span className="font-mono text-xs text-[#5b4dff]">Step {i + 1}</span>
            </div>
            <h3 className="font-semibold text-[#f0f0ff]">{step.title}</h3>
            <p className="text-sm text-[#8888aa] leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
