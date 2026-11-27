import React from 'react';
import { X, Cpu, Database, HardDrive, Sparkles, ArrowRight } from 'lucide-react';
import { SystemStatus } from '../types.js';

interface ArchitectureInspectorModalProps {
  systemStatus: SystemStatus | null;
  onClose: () => void;
  onRunTestQuery: (q: string) => void;
}

const SAMPLE_QUERIES = ['Pool party', 'Beach in July', 'College trip', 'Sunset'];

export const ArchitectureInspectorModal: React.FC<ArchitectureInspectorModalProps> = ({
  systemStatus,
  onClose,
  onRunTestQuery,
}) => {
  const stats = [
    {
      label: 'Vision',
      value: 'Gemini 3.5 Flash Lite',
      icon: Sparkles,
      accent: 'text-blue-600',
    },
    {
      label: 'Vectors',
      value: `${systemStatus?.indexedVectorsCount ?? 0} indexed`,
      icon: Cpu,
      accent: 'text-indigo-600',
    },
    {
      label: 'Database',
      value: systemStatus?.firestoreConnected ? 'Firestore Live' : 'Memory Cache',
      icon: Database,
      accent: 'text-emerald-600',
    },
    {
      label: 'Storage',
      value: `${systemStatus?.googleDriveActiveCount ?? 0} Drive pooled`,
      icon: HardDrive,
      accent: 'text-sky-600',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Pipeline"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl neo-raised-lg bg-[#EEF2F6] p-6 sm:p-7 space-y-6 border border-white/80"
      >
        {/* Minimal Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">AI Pipeline</h2>
            <p className="text-xs text-slate-500">Multimodal indexing & local semantic search</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full neo-btn flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Quiet Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="p-3.5 rounded-2xl neo-raised-sm space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <Icon className={`w-3.5 h-3.5 ${item.accent}`} />
                  <span>{item.label}</span>
                </div>
                <div className="text-xs font-bold text-slate-800 truncate" title={item.value}>
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Clean 3-Step Flow */}
        <div className="p-4 rounded-2xl neo-inset flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-800">1. Upload & Vision</div>
            <div className="text-[11px] text-slate-500">Gemini 3.5 Flash Lite</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 sm:rotate-0 shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-800">2. Vector Index</div>
            <div className="text-[11px] text-slate-500">3072-D Dense Embeddings</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 sm:rotate-0 shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-800">3. Instant Search</div>
            <div className="text-[11px] text-slate-500">Sub-5ms · $0 query cost</div>
          </div>
        </div>

        {/* 4 Quiet Sample Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Try:</span>
          {SAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => {
                onRunTestQuery(q);
                onClose();
              }}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 bg-white/70 hover:bg-white border border-slate-200/80 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
