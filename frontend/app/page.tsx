import Hero from '@/components/Hero';
import RepoInput from '@/components/RepoInput';
import { Github } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-6 glass border-b border-[#2a2a3a]">
        <span className="font-mono font-bold text-[#f0f0ff] text-sm tracking-tight">
          Code<span className="text-[#5b4dff]">Graph</span>
        </span>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Boweii22/Code-graph"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#2a2a3a] bg-[#111118] text-xs text-[#8888aa] hover:text-[#f0f0ff] transition-colors"
          >
            <Github size={14} />
            GitHub
          </a>
          <a
            href="https://proofofusefulness.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:block px-3 py-1.5 rounded bg-[#00d4a0] text-[#0a0a0f] text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            HackerNoon Hackathon
          </a>
        </div>
      </nav>

      {/* Hero section */}
      <Hero />

      {/* Repo input — below headline */}
      <div className="relative z-10 px-4 pb-8 -mt-4">
        <RepoInput />
      </div>

      {/* Demo video */}
      <div className="relative z-10 w-full max-w-4xl mx-auto mt-16 px-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-[#2a2a3a]" />
          <span className="text-xs font-mono text-[#44445a] uppercase tracking-widest">Live demo</span>
          <div className="h-px flex-1 bg-[#2a2a3a]" />
        </div>
        <div className="rounded-xl overflow-hidden border border-[#2a2a3a]"
          style={{ boxShadow: '0 0 0 1px #2a2a3a, 0 32px 80px rgba(0,0,0,0.6), 0 0 80px rgba(91,77,255,0.08)' }}>
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111118] border-b border-[#2a2a3a]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#f87171]" />
              <div className="w-3 h-3 rounded-full bg-[#fbbf24]" />
              <div className="w-3 h-3 rounded-full bg-[#00d4a0]" />
            </div>
            <div className="flex-1 mx-4 h-5 rounded bg-[#1a1a24] border border-[#2a2a3a] flex items-center px-3">
              <span className="text-[10px] font-mono text-[#44445a]">codegraph.vercel.app</span>
            </div>
          </div>
          {/* Video */}
          <video
            src="/demo1.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full block"
          />
        </div>
        <p className="text-center text-xs text-[#44445a] mt-3 font-mono">
          Interactive graph explorer · Click any node · Ask Claude anything
        </p>
      </div>

      {/* Powered by */}
      <footer className="mt-auto border-t border-[#2a2a3a] py-6 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-xs text-[#44445a]">
          <span>Powered by</span>
          <span className="text-[#00d4a0] font-mono font-semibold">Neo4j AuraDB</span>
          <span className="text-[#5b4dff] font-mono font-semibold">Claude AI</span>
          <span className="text-[#8888aa] font-mono font-semibold">OpenAI Embeddings</span>
        </div>
        <div className="text-xs text-[#44445a]">
          MIT License · Built for HackerNoon &ldquo;Proof of Usefulness&rdquo; Hackathon
        </div>
      </footer>
    </main>
  );
}
