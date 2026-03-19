import Hero from '@/components/Hero';
import RepoInput from '@/components/RepoInput';
import DemoPreview from '@/components/DemoPreview';
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

      {/* Demo preview */}
      <DemoPreview />

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
