# CodeGraph

> Turn any GitHub repo into an interactive knowledge graph. Ask questions in plain English.

[![HackerNoon Hackathon](https://img.shields.io/badge/HackerNoon-Proof%20of%20Usefulness-00d4a0?style=flat-square)](https://hackernoon.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-5b4dff?style=flat-square)](LICENSE)
[![Neo4j](https://img.shields.io/badge/Powered%20by-Neo4j%20AuraDB-018BFF?style=flat-square)](https://neo4j.com/cloud/aura-free/)
[![Claude](https://img.shields.io/badge/AI-Claude%20Sonnet-5b4dff?style=flat-square)](https://anthropic.com)

**Paste a public GitHub URL → get an interactive knowledge graph → ask anything via GraphRAG + Claude AI.**

---

## Features

- **AST Parsing** — tree-sitter parses Python, JS, TS, Go, Rust into nodes (File, Class, Function, Module)
- **Neo4j Knowledge Graph** — all relationships stored with edges: CALLS, IMPORTS, DEFINED_IN, BELONGS_TO, DEPENDS_ON
- **GraphRAG** — vector similarity search finds the most relevant subgraph, then Claude answers in context
- **Interactive Cytoscape.js canvas** — zoom, filter by node type, search, click to explore
- **Node sidebar** — source preview, call chains, Cypher query copy
- **AI chat panel** — streaming answers, follow-up suggestions, subgraph highlighting

---

## Quick Start (5 commands)

```bash
# 1. Clone
git clone https://github.com/your-username/codegraph
cd codegraph

# 2. Configure secrets
cp backend/.env.example backend/.env
# Edit backend/.env with your Neo4j, OpenAI, and Anthropic keys

cp frontend/.env.local.example frontend/.env.local

# 3. Start with Docker
docker-compose up --build

# 4. Open
open http://localhost:3000

# 5. Paste a GitHub URL and hit Analyze!
```

### Local dev (no Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│  Next.js 14 (App Router)  ·  Cytoscape.js  ·  Zustand store    │
│  Landing page  →  Graph explorer  ·  ChatPanel  ·  NodeSidebar  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP (Axios)
┌───────────────────────────────▼─────────────────────────────────┐
│                      FastAPI (Python)                            │
│  POST /api/jobs  →  BackgroundTask pipeline:                     │
│    1. gitpython clone (depth=1)                                  │
│    2. tree-sitter AST parse (Py/JS/TS/Go/Rust)                  │
│    3. graph_builder → nodes + edges                              │
│    4. neo4j_service → Cypher MERGE                               │
│    5. embedding_service → text-embedding-3-small                 │
│  GET  /api/graph/{jobId}  →  full graph for Cytoscape           │
│  POST /api/query  →  GraphRAG → Claude Sonnet                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
              ┌─────────────────┼──────────────────┐
              │                 │                  │
      ┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
      │ Neo4j AuraDB │  │ OpenAI API   │  │ Anthropic API│
      │ (Graph + Vec)│  │ (Embeddings) │  │ (Claude AI)  │
      └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Environment Variables

### `backend/.env`
```
NEO4J_URI=neo4j+s://YOUR_AURA_INSTANCE.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_aura_password
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Getting Neo4j AuraDB (Free)

1. Go to [neo4j.com/cloud/aura-free](https://neo4j.com/cloud/aura-free/)
2. Create account → "Create Free Instance" (AuraDB Free)
3. Copy the connection URI: `neo4j+s://xxxxx.databases.neo4j.io`
4. Save the generated password — **shown only once**
5. Paste into `backend/.env`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Graph viz | Cytoscape.js + cytoscape-fcose |
| State | Zustand |
| Backend | Python FastAPI + uvicorn |
| Parser | tree-sitter (Python, JS, TS, Go, Rust) |
| Graph DB | Neo4j AuraDB |
| Embeddings | OpenAI text-embedding-3-small |
| AI | Anthropic Claude Sonnet (claude-sonnet-4-20250514) |
| Deployment | Docker + docker-compose |

---

## Powered By

- **[Neo4j AuraDB](https://neo4j.com/cloud/aura-free/)** — Cloud graph database with vector search
- **[Claude AI](https://anthropic.com)** — Anthropic's Claude Sonnet for code analysis
- **[OpenAI](https://openai.com)** — text-embedding-3-small for semantic search

---

## Contributing

PRs welcome! Please open an issue first to discuss changes.

---

## License

MIT
