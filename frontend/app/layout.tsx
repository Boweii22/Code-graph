import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'CodeGraph — Understand any codebase in 30 seconds',
  description:
    'Paste a GitHub repo. Get an interactive knowledge graph, call chains, and AI answers — powered by Neo4j GraphRAG.',
  openGraph: {
    title: 'CodeGraph',
    description: 'Turn any GitHub repo into an interactive knowledge graph.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="bg-[#0a0a0f] text-[#f0f0ff] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
