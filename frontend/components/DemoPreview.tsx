'use client';

import { motion } from 'framer-motion';

// Static node positions for the demo graph
const NODES = [
  { id: 'n1', x: 300, y: 160, type: 'File',     label: 'auth/login.py',      color: '#00d4a0', size: 14 },
  { id: 'n2', x: 180, y: 260, type: 'Class',    label: 'AuthService',         color: '#a78bfa', size: 12 },
  { id: 'n3', x: 420, y: 260, type: 'Class',    label: 'UserModel',           color: '#a78bfa', size: 12 },
  { id: 'n4', x: 100, y: 370, type: 'Function', label: 'validate_token',      color: '#38bdf8', size: 9  },
  { id: 'n5', x: 230, y: 390, type: 'Function', label: 'hash_password',       color: '#38bdf8', size: 9  },
  { id: 'n6', x: 360, y: 370, type: 'Function', label: 'create_user',         color: '#38bdf8', size: 9  },
  { id: 'n7', x: 480, y: 370, type: 'Function', label: 'get_current_user',    color: '#38bdf8', size: 9  },
  { id: 'n8', x: 560, y: 200, type: 'Module',   label: 'fastapi',             color: '#fb923c', size: 10 },
  { id: 'n9', x: 560, y: 290, type: 'Module',   label: 'sqlalchemy',          color: '#fb923c', size: 10 },
  { id: 'n10',x: 140, y: 160, type: 'File',     label: 'models/user.py',      color: '#00d4a0', size: 14 },
  { id: 'n11',x: 460, y: 160, type: 'File',     label: 'routers/auth.py',     color: '#00d4a0', size: 14 },
];

const EDGES = [
  { s: 'n1',  t: 'n2',  color: '#00d4a040' },
  { s: 'n1',  t: 'n3',  color: '#00d4a040' },
  { s: 'n2',  t: 'n4',  color: '#a78bfa40' },
  { s: 'n2',  t: 'n5',  color: '#a78bfa40' },
  { s: 'n3',  t: 'n6',  color: '#a78bfa40' },
  { s: 'n3',  t: 'n7',  color: '#a78bfa40' },
  { s: 'n4',  t: 'n5',  color: '#38bdf840' },
  { s: 'n6',  t: 'n7',  color: '#38bdf840' },
  { s: 'n1',  t: 'n8',  color: '#fb923c30' },
  { s: 'n3',  t: 'n9',  color: '#fb923c30' },
  { s: 'n10', t: 'n2',  color: '#00d4a040' },
  { s: 'n11', t: 'n4',  color: '#38bdf840' },
  { s: 'n11', t: 'n7',  color: '#38bdf840' },
];

const nodeById = Object.fromEntries(NODES.map(n => [n.id, n]));

// Sidebar content for the "selected" node
const SELECTED = NODES[3]; // validate_token

export default function DemoPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.7 }}
      className="relative z-10 w-full max-w-4xl mx-auto mt-16 px-4"
    >
      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-[#2a2a3a]" />
        <span className="text-xs font-mono text-[#44445a] uppercase tracking-widest">Live demo</span>
        <div className="h-px flex-1 bg-[#2a2a3a]" />
      </div>

      {/* Browser chrome mockup */}
      <div className="rounded-xl border border-[#2a2a3a] overflow-hidden shadow-2xl"
        style={{ boxShadow: '0 0 0 1px #2a2a3a, 0 32px 80px rgba(0,0,0,0.6), 0 0 80px rgba(91,77,255,0.08)' }}>

        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111118] border-b border-[#2a2a3a]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#f87171]" />
            <div className="w-3 h-3 rounded-full bg-[#fbbf24]" />
            <div className="w-3 h-3 rounded-full bg-[#00d4a0]" />
          </div>
          <div className="flex-1 mx-4 h-5 rounded bg-[#1a1a24] border border-[#2a2a3a] flex items-center px-3">
            <span className="text-[10px] font-mono text-[#44445a]">codegraph.vercel.app/graph/a8f3...</span>
          </div>
        </div>

        {/* App topbar */}
        <div className="flex items-center justify-between px-4 h-10 bg-[#0a0a0f] border-b border-[#2a2a3a]">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-xs text-[#f0f0ff]">Code<span className="text-[#5b4dff]">Graph</span></span>
            <span className="text-[#2a2a3a] text-xs">·</span>
            <span className="text-[10px] font-mono text-[#8888aa]">tiangolo/fastapi</span>
            <span className="text-[#2a2a3a] text-xs">·</span>
            <span className="text-[10px] font-mono text-[#8888aa]">247 nodes · 891 edges</span>
          </div>
          <div className="flex gap-2">
            {['fcose ▾', 'Export', 'Share'].map(l => (
              <div key={l} className="px-2 h-5 rounded border border-[#2a2a3a] bg-[#111118] text-[10px] font-mono text-[#44445a] flex items-center">{l}</div>
            ))}
          </div>
        </div>

        {/* Main 3-panel area */}
        <div className="flex bg-[#0a0a0f]" style={{ height: 340 }}>

          {/* Left sidebar */}
          <div className="w-[160px] flex-shrink-0 border-r border-[#2a2a3a] p-3 flex flex-col gap-3">
            <div>
              <div className="text-[9px] font-mono text-[#44445a] uppercase tracking-widest mb-2">Node Types</div>
              {[['#00d4a0','▪','File','34'],['#a78bfa','◆','Class','21'],['#38bdf8','●','Function','178'],['#fb923c','⬡','Module','14']].map(([c,i,t,n]) => (
                <div key={t} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: c as string }} className="text-xs">{i}</span>
                    <span className="text-[10px] font-mono text-[#8888aa]">{t}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#44445a]">{n}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[9px] font-mono text-[#44445a] uppercase tracking-widest mb-1.5">Stats</div>
              {[['Nodes','247'],['Edges','891'],['Languages','Python']].map(([l,v]) => (
                <div key={l} className="flex justify-between text-[10px] py-0.5">
                  <span className="text-[#44445a]">{l}</span>
                  <span className="font-mono text-[#8888aa]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Graph canvas */}
          <div className="flex-1 relative overflow-hidden">
            <svg width="100%" height="100%" viewBox="60 120 440 280" preserveAspectRatio="xMidYMid meet">
              {/* Edges */}
              {EDGES.map((e, i) => {
                const s = nodeById[e.s], t = nodeById[e.t];
                return (
                  <motion.line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke={e.color} strokeWidth="1"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.04, duration: 0.3 }}
                  />
                );
              })}

              {/* Nodes */}
              {NODES.map((n, i) => (
                <motion.g key={n.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.06, duration: 0.3, type: 'spring' }}
                  style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                >
                  {/* Highlight ring for selected node */}
                  {n.id === SELECTED.id && (
                    <motion.circle cx={n.x} cy={n.y} r={n.size + 5}
                      fill="none" stroke="#5b4dff" strokeWidth="1.5"
                      animate={{ r: [n.size + 4, n.size + 7, n.size + 4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <circle cx={n.x} cy={n.y} r={n.size / 2 + 4}
                    fill={n.color} fillOpacity={n.id === SELECTED.id ? 1 : 0.85}
                  />
                  <text x={n.x} y={n.y + n.size / 2 + 10}
                    textAnchor="middle" fill="#f0f0ff" fontSize="7"
                    fontFamily="monospace" opacity="0.8">
                    {n.label.split('/').pop()}
                  </text>
                </motion.g>
              ))}
            </svg>

            {/* Toolbar dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 rounded border border-[#2a2a3a] bg-[#111118]/80">
              {['+','−','⤢'].map(b => (
                <div key={b} className="w-5 h-5 flex items-center justify-center text-[10px] text-[#44445a] rounded hover:bg-[#1a1a24]">{b}</div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <motion.div
            initial={{ x: 160 }} animate={{ x: 0 }}
            transition={{ delay: 1.2, duration: 0.4, type: 'spring', damping: 25 }}
            className="w-[160px] flex-shrink-0 border-l border-[#2a2a3a] p-3 bg-[#0a0a0f] overflow-hidden"
          >
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[#38bdf8] text-sm">●</span>
              <div>
                <p className="text-[10px] font-mono font-semibold text-[#f0f0ff]">validate_token</p>
                <p className="text-[9px] text-[#8888aa]">Function · login.py</p>
              </div>
            </div>
            <div className="space-y-1.5 text-[9px]">
              {[['FILE','auth/login.py'],['LINES','24 – 51'],['LANG','Python']].map(([l,v]) => (
                <div key={l} className="flex justify-between">
                  <span className="font-mono text-[#44445a]">{l}</span>
                  <span className="text-[#8888aa] font-mono">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="text-[9px] font-mono text-[#44445a] uppercase tracking-widest mb-1.5">Calls (3)</div>
              {['decode_jwt','check_expiry','log_event'].map(f => (
                <div key={f} className="text-[9px] font-mono text-[#38bdf8] py-0.5 flex items-center gap-1">
                  <span className="text-[#44445a]">→</span>{f}
                </div>
              ))}
            </div>
            <div className="mt-3 p-2 rounded bg-[#0a0a0f] border border-[#2a2a3a]">
              <p className="text-[8px] font-mono text-[#44445a] leading-relaxed">
                def validate_token(<br />
                &nbsp;&nbsp;token: str,<br />
                &nbsp;&nbsp;db: Session<br />
                ) -&gt; User:
              </p>
            </div>
          </motion.div>
        </div>

        {/* Query bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-t border-[#2a2a3a] bg-[#0a0a0f]">
          <div className="flex-1 h-7 rounded bg-[#111118] border border-[#2a2a3a] flex items-center px-3">
            <span className="text-[10px] font-mono text-[#44445a]">Ask anything: &ldquo;Who calls validate_token?&rdquo;</span>
          </div>
          <div className="h-7 px-3 rounded bg-[#5b4dff] flex items-center text-[10px] font-semibold text-white">
            Ask Claude →
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="text-center text-xs text-[#44445a] mt-3 font-mono">
        Interactive graph explorer · Click any node · Ask Claude anything
      </p>
    </motion.div>
  );
}
