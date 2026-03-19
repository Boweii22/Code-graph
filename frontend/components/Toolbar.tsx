'use client';

import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// The toolbar uses a global event bus pattern to communicate with GraphCanvas
// since Cytoscape instance is encapsulated inside that component.

const toolbarEvents = typeof window !== 'undefined'
  ? new EventTarget()
  : null;

export function emitToolbarEvent(name: 'zoom-in' | 'zoom-out' | 'fit') {
  toolbarEvents?.dispatchEvent(new Event(name));
}

export function subscribeToolbar(
  name: 'zoom-in' | 'zoom-out' | 'fit',
  handler: () => void
) {
  toolbarEvents?.addEventListener(name, handler);
  return () => toolbarEvents?.removeEventListener(name, handler);
}

export default function Toolbar() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-3 py-2 glass rounded-lg shadow-xl">
      <button
        onClick={() => emitToolbarEvent('zoom-in')}
        className="w-7 h-7 flex items-center justify-center rounded text-[#8888aa] hover:text-[#f0f0ff] hover:bg-[#1a1a24] transition-colors"
        title="Zoom in"
      >
        <ZoomIn size={14} />
      </button>
      <button
        onClick={() => emitToolbarEvent('zoom-out')}
        className="w-7 h-7 flex items-center justify-center rounded text-[#8888aa] hover:text-[#f0f0ff] hover:bg-[#1a1a24] transition-colors"
        title="Zoom out"
      >
        <ZoomOut size={14} />
      </button>
      <div className="w-px h-4 bg-[#2a2a3a] mx-1" />
      <button
        onClick={() => emitToolbarEvent('fit')}
        className="w-7 h-7 flex items-center justify-center rounded text-[#8888aa] hover:text-[#f0f0ff] hover:bg-[#1a1a24] transition-colors"
        title="Fit to screen"
      >
        <Maximize2 size={14} />
      </button>
    </div>
  );
}
