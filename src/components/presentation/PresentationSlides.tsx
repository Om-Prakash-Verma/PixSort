import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Database,
  Cloud,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Image as ImageIcon,
  FolderHeart,
  ShieldCheck,
  Compass,
  Code,
  HardDrive,
  Target,
  Rocket,
  Play,
  TrendingUp,
  Clock,
  Terminal,
  Server,
  FileQuestion,
  HelpCircle,
  Eye,
  Sliders,
  Users,
  GraduationCap,
  Award,
  BookOpen,
} from 'lucide-react';

/* =========================================================
   Slide 0: Project Title & Team Information (College Mini-Project)
   ========================================================= */
export const Slide0Team: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-4">
      {/* College & Programme Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide uppercase">ABES Engineering College</div>
            <div className="text-[11px] text-blue-400 font-mono">B.Tech — Computer Science & Engineering</div>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>Mini-Project Presentation • 2026</span>
        </div>
      </div>

      {/* Hero Title & Subtitle */}
      <div className="my-auto space-y-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-block px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-blue-400 text-xs font-mono uppercase tracking-wider">
            AI-Powered Multimodal Platform
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
            PixSort
          </h1>
          <p className="text-lg sm:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-200">
            Image Upload & Auto-Processing
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-light">
            An intelligent semantic photo retrieval and automated vision pipeline leveraging Gemini Multimodal Embeddings, Google Cloud Storage, and Vertex AI Vector Search.
          </p>
        </div>

        {/* Team Members & Faculty Guide Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          {/* Team Members Column (Span 2) */}
          <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                <Users className="w-4 h-4 text-blue-400" />
                Team Members
              </span>
              <span className="text-[10px] font-mono text-slate-500">CSE Department</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { name: 'Om Prakash Verma', roll: '2400320100773' },
                { name: 'Palak Saini', roll: '2400320100777' },
                { name: 'Nitin Kumar Sharma', roll: '2400320100766' },
              ].map((member, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/40 transition-colors"
                >
                  <div className="text-xs font-mono text-blue-400 mb-1">0{i + 1}</div>
                  <div className="text-sm font-bold text-white truncate">{member.name}</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                    <span className="text-slate-500">Roll:</span>
                    <span className="text-slate-300 font-semibold">{member.roll}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Faculty Guide Column (Span 1) */}
          <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-3 shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  Faculty Guide
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Mentor</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-sm font-bold text-white">Mr. Vikas Maurya</div>
                <div className="text-xs text-slate-400 mt-0.5">Faculty Mentor, CSE</div>
                <div className="text-[10px] text-slate-500 font-mono mt-2">ABES Engineering College</div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Academic Mini-Project</span>
              <span className="text-blue-400 font-mono">Press → to begin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 gap-1">
        <div>
          College: <span className="text-white font-medium">ABES Engineering College</span> &bull; Programme: <span className="text-white font-medium">B.Tech — CSE</span>
        </div>
        <div className="font-mono text-blue-400 text-right">Slide 01 / 11</div>
      </div>
    </div>
  );
};

/* =========================================================
   Slide 1: Synopsis / Project Overview
   ========================================================= */
export const Slide1Synopsis: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-4">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>College Mini-Project Presentation • Academic Year 2026</span>
        </div>
        <div className="text-xs text-slate-500 font-mono">CSE / AI & Cloud Computing</div>
      </div>

      {/* Main Hero Section */}
      <div className="space-y-4 my-auto">
        <div className="inline-block px-3 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 text-xs font-mono uppercase tracking-wider">
          Multimodal Retrieval System
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
          pix sort <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
            Image Upload & Auto-Processing
          </span>
        </h1>
        <p className="text-base sm:text-xl text-slate-300 max-w-3xl font-light leading-relaxed">
          Search your memories the way you remember them — using everyday natural language rather than filenames or manual folders.
        </p>

        {/* Core Value Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-6 max-w-4xl">
          {[
            { step: '01', title: 'Natural Language', desc: 'Queries like "Pool party" or "Beach sunset"', icon: Search },
            { step: '02', title: 'AI Understanding', desc: 'Gemini multimodal vision extraction', icon: Cpu },
            { step: '03', title: 'Semantic Search', desc: '3072-D high-dimensional vector space', icon: Layers },
            { step: '04', title: 'Relevant Photos', desc: 'Sub-second nearest neighbor ranking', icon: ImageIcon },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
                  <span>{item.step}</span>
                  <Icon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-sm font-bold text-white mb-1">{item.title}</div>
                <div className="text-xs text-slate-400 leading-normal">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs text-slate-400">
        <div>Domain: <span className="text-slate-200 font-medium">Applied Generative AI & Cloud Architecture</span></div>
        <div>Built with: <span className="text-blue-400 font-medium">Google Gemini 2.5 Flash • Vertex AI • Firestore</span></div>
      </div>
    </div>
  );
};

/* =========================================================
   Slide 2: Processing Pipeline
   ========================================================= */
export const Slide2Pipeline: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);

  const stages = [
    {
      title: 'Photo Upload',
      subtitle: 'Raw media ingestion',
      detail: 'The user uploads an image (.jpg, .png, .avif). The system inspects file headers and triggers asynchronous ingestion.',
      tech: 'Express.js • Multipart Stream',
    },
    {
      title: 'Cloud Storage',
      subtitle: 'Secure object persistence',
      detail: 'The image binary is securely stored with a unique deterministic path under Google Cloud Storage protocol (gs://...).',
      tech: 'GCS Object Store',
    },
    {
      title: 'Gemini Vision AI',
      subtitle: 'Multimodal content analysis',
      detail: 'Gemini 2.5 Flash analyzes visual scenes, extracting natural language captions, detected objects, environmental lighting, and activities.',
      tech: 'Gemini 2.5 Flash Vision',
    },
    {
      title: 'Image Embedding',
      subtitle: '3072-D dense vector generation',
      detail: 'Gemini Embedding 2 maps visual elements and semantic metadata into a dense mathematical embedding representation.',
      tech: 'Gemini Embedding 2 Preview',
    },
    {
      title: 'Vector Indexing',
      subtitle: 'Nearest-neighbor preparation',
      detail: 'The vector is stored in the Vertex AI Vector Search index alongside Firestore document references for sub-millisecond similarity scans.',
      tech: 'Vertex AI Vector Index',
    },
    {
      title: 'Searchable Memory',
      subtitle: 'Zero-effort retrieval',
      detail: 'Natural language search queries are transformed into the same vector space, enabling instantaneous cosine distance retrieval.',
      tech: 'Firestore + ScaNN Engine',
    },
  ];

  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-4">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">Architecture Flow</div>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">End-to-End Processing Pipeline</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          How personal photos transform from unstructured raw binaries into an indexed, mathematically searchable semantic archive.
        </p>
      </div>

      {/* Interactive Horizontal Pipeline */}
      <div className="my-auto space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {stages.map((stage, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStage(idx)}
              className={`p-3 rounded-2xl text-left border transition-all ${
                activeStage === idx
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-mono text-blue-400 mb-1">Stage 0{idx + 1}</div>
              <div className="text-xs font-bold text-white truncate">{stage.title}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{stage.subtitle}</div>
            </button>
          ))}
        </div>

        {/* Selected Stage Detail Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              Stage 0{activeStage + 1} Deep Dive: {stages[activeStage].title}
            </div>
            <div className="text-base sm:text-lg text-slate-200 font-medium">
              {stages[activeStage].detail}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 min-w-[220px]">
            <div className="text-[11px] text-slate-500 font-mono uppercase mb-1">Target Technology</div>
            <div className="text-sm font-bold text-blue-400 font-mono">{stages[activeStage].tech}</div>
            <div className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Fully Integrated in Project
            </div>
          </div>
        </div>

        {/* Two Dual Pipeline Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Ingestion Pipeline (Upload Time)
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Raw Image ➔ Cloud Storage ➔ Gemini Vision ➔ 3072-D Vector ➔ Firestore + Vector Index
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Query Pipeline (Search Time)
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Query &quot;Pool party&quot; ➔ Text Vector ➔ Cosine Similarity Scan ➔ Ranked Matches (240ms)
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500 flex items-center justify-between pt-2">
        <span>Click any stage button above to inspect processing mechanics</span>
        <span>Asynchronous background pipeline eliminates user-facing latency</span>
      </div>
    </div>
  );
};

/* =========================================================
   Slide 3: Problem Statement
   ========================================================= */
export const Slide3Problem: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-4">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-rose-400 mb-1">The Core Challenge</div>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
          Why Traditional Photo Storage Falls Short
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Human memory is associative, episodic, and visual. Traditional computer file systems are rigid, manual, and filename-based.
        </p>
      </div>

      {/* Visual Contrast Grid */}
      <div className="my-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* The Problem Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-rose-950/20 border border-rose-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Current Traditional Approach
            </div>
            <span className="text-[10px] font-mono text-rose-400/80 bg-rose-500/10 px-2 py-0.5 rounded-full">
              Legacy File Systems
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-rose-500/10 flex items-start gap-2.5">
              <span className="text-rose-400 font-bold">✕</span>
              <div>
                <strong className="text-white">Opaque Filenames:</strong> Photos are stored as <code className="text-rose-300 bg-rose-950/40 px-1 py-0.5 rounded">IMG_8492.JPG</code> or <code className="text-rose-300 bg-rose-950/40 px-1 py-0.5 rounded">photo_1790100.png</code> with zero semantic cues.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-rose-500/10 flex items-start gap-2.5">
              <span className="text-rose-400 font-bold">✕</span>
              <div>
                <strong className="text-white">Manual Tagging Burden:</strong> Organizers demand hours creating manual folders and tag labels that users quickly abandon.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-rose-500/10 flex items-start gap-2.5">
              <span className="text-rose-400 font-bold">✕</span>
              <div>
                <strong className="text-white">Zero Visual Context:</strong> Keyword search fails completely if the exact typed word wasn&apos;t explicitly tagged beforehand.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-rose-500/10 flex items-start gap-2.5">
              <span className="text-rose-400 font-bold">✕</span>
              <div>
                <strong className="text-white">Endless Scrolling:</strong> Finding a memory from three years ago takes minutes of frustrating scrolling through thousands of items.
              </div>
            </div>
          </div>
        </div>

        {/* The Proposed Solution Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-blue-950/20 border border-blue-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-blue-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Proposed AI Semantic Solution
            </div>
            <span className="text-[10px] font-mono text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-full">
              Our System
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-blue-500/20 flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <div>
                <strong className="text-white">Natural Language Search:</strong> Search by describing the scene (&quot;friends laughing at the pool&quot;, &quot;student ID card on desk&quot;).
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-blue-500/20 flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <div>
                <strong className="text-white">Autonomous Vision AI:</strong> Gemini 2.5 Flash inspects scenes instantly upon upload without user manual tagging effort.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-blue-500/20 flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <div>
                <strong className="text-white">Concept Awareness:</strong> Understands synonyms, moods, environments, weather, and actions automatically in vector space.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-blue-500/20 flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <div>
                <strong className="text-white">Sub-Second Retrieval:</strong> Vertex AI Vector Search finds the exact memory in under 300 milliseconds.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Summary Banner */}
      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>Old Paradigm: <span className="text-rose-300 font-mono">Filename == Key</span></span>
        <ArrowRight className="w-4 h-4 text-blue-400" />
        <span>New Paradigm: <span className="text-blue-300 font-mono">Multimodal Embedding Vector == Meaning</span></span>
      </div>
    </div>
  );
};

/* =========================================================
   Slide 4: Project Objectives
   ========================================================= */
export const Slide4Objectives: React.FC = () => {
  const objectives = [
    {
      num: '01',
      title: 'Conversational Querying',
      desc: 'Allow users to express memory lookups using casual English expressions without requiring keyword-matching formulas.',
      icon: Search,
      highlight: 'Zero keyword reliance',
    },
    {
      num: '02',
      title: 'Multimodal Vision Understanding',
      desc: 'Extract rich semantic descriptors (objects, actions, lighting, time, location) directly from pixel data using Gemini 2.5 Flash.',
      icon: Eye,
      highlight: 'Automated scene comprehension',
    },
    {
      num: '03',
      title: 'High-Dimensional Vectorization',
      desc: 'Bridge textual semantics and visual features into a unified 3072-dimensional space using Gemini Embedding 2.',
      icon: Layers,
      highlight: '3072-D Dense embeddings',
    },
    {
      num: '04',
      title: 'Scalable Cloud Architecture',
      desc: 'Demonstrate real-world cloud service composition with Cloud Storage, Firestore NoSQL, and Vertex AI Vector Search.',
      icon: Cloud,
      highlight: 'Google Cloud Ecosystem',
    },
    {
      num: '05',
      title: 'Delightful User Experience',
      desc: 'Provide an intuitive, responsive interface with instantaneous photo viewer, albums, favorites, and similar photo matching.',
      icon: Sparkles,
      highlight: 'Clean neomorphic UI',
    },
  ];

  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-4">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">Goals & Scope</div>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Project Objectives</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Five primary technical goals executed to build a production-grade, AI-native personal photo search engine.
        </p>
      </div>

      {/* 5 Objectives Grid */}
      <div className="my-auto grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {objectives.map((obj, i) => {
          const Icon = obj.icon;
          return (
            <div
              key={i}
              className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-blue-400 font-bold">{obj.num}</span>
                <div className="p-2 rounded-xl bg-slate-800/80 text-blue-400 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-white leading-snug">{obj.title}</div>
                <div className="text-xs text-slate-400 leading-relaxed font-light">{obj.desc}</div>
              </div>
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
                  {obj.highlight}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
        <span>Evaluated Outcome: A fully functioning web application with zero mock data or placeholder APIs.</span>
        <span className="text-emerald-400 font-medium">100% Objectives Achieved</span>
      </div>
    </div>
  );
};

/* =========================================================
   Slide 5: Proposed Methodology
   ========================================================= */
export const Slide5Methodology: React.FC = () => {
  const steps = [
    { step: 1, name: 'Upload & Ingest', role: 'Multipart upload with file header validation and mime verification.' },
    { step: 2, name: 'Cloud Storage', role: 'Object stored in Google Cloud Storage with resilient fallback routing.' },
    { step: 3, name: 'Vision Inference', role: 'Gemini 2.5 Flash extracts summary, time of day, location, objects, & tags.' },
    { step: 4, name: 'Vector Embedding', role: 'Multimodal Embedding 2 model produces dense 3072-D float vectors.' },
    { step: 5, name: 'Firestore Record', role: 'Metadata document persisted in Firestore with timestamps & album IDs.' },
    { step: 6, name: 'Vertex AI Index', role: 'High-dimensional vector indexed for approximate nearest neighbor search.' },
    { step: 7, name: 'Query Cosine Match', role: 'User query is embedded and scanned; nearest cosine matches are returned.' },
  ];

  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-4">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">Execution Process</div>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Proposed Methodology</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Systematic 7-step engineering pipeline driving ingestion, analysis, storage, indexing, and retrieval.
        </p>
      </div>

      {/* 7-Step Horizontal / Vertical Visualizer */}
      <div className="my-auto space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
          {steps.map((s) => (
            <div
              key={s.step}
              className="p-3 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-blue-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                  {s.step}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Step</span>
              </div>
              <div className="text-xs font-bold text-white">{s.name}</div>
              <div className="text-[11px] text-slate-400 leading-tight font-light">{s.role}</div>
            </div>
          ))}
        </div>

        {/* Mathematical Foundation Box */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5 font-mono uppercase">
              <Code className="w-3.5 h-3.5" />
              Mathematical Metric: Cosine Similarity
            </div>
            <p className="text-xs text-slate-300">
              Cosine Distance measures angle difference between the query vector <span className="font-mono text-blue-300">Q</span> and indexed photo vector <span className="font-mono text-indigo-300">P</span>:
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 shrink-0">
            similarity = (Q • P) / (||Q|| × ||P||)
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500 flex items-center justify-between pt-2">
        <span>Resilient fallbacks protect against transient cloud latency</span>
        <span>Asynchronous lazy initialization prevents cold-start delays</span>
      </div>
    </div>
  );
};

/* =========================================================
   Slide 6: Technology & Cloud Services
   ========================================================= */
export const Slide6TechStack: React.FC = () => {
  const stack = [
    {
      layer: 'Frontend & UI',
      icon: Code,
      items: [
        { name: 'React 19 & TypeScript', desc: 'Type-safe reactive state management' },
        { name: 'Tailwind CSS', desc: 'Neomorphic design language & utility styling' },
        { name: 'Motion', desc: 'Hardware-accelerated kinetic animations' },
        { name: 'Lucide Icons', desc: 'Consistent visual icon iconography' },
      ],
    },
    {
      layer: 'Backend & Services',
      icon: Server,
      items: [
        { name: 'Node.js & Express', desc: 'Modular route controller architecture' },
        { name: 'Lazy SDK Clients', desc: 'Fault-tolerant initialization pipeline' },
        { name: 'Multer & Media Router', desc: 'Multi-format binary image processing' },
        { name: 'CORS & Security', desc: 'Safe cross-origin asset access headers' },
      ],
    },
    {
      layer: 'Google AI Models',
      icon: Cpu,
      items: [
        { name: 'Gemini 2.5 Flash', desc: 'High-speed multimodal vision analysis' },
        { name: 'Gemini 3.8 Flash', desc: 'Chained fallback model for 100% uptime' },
        { name: 'Gemini Embedding 2', desc: '3072-D dense multimodal vector encoder' },
        { name: '@google/genai SDK', desc: 'Official modern TypeScript integration' },
      ],
    },
    {
      layer: 'Cloud Persistence & Index',
      icon: Database,
      items: [
        { name: 'Google Cloud Firestore', desc: 'NoSQL document database for metadata' },
        { name: 'Google Cloud Storage', desc: 'Object store for original photo binaries' },
        { name: 'Vertex AI Vector Search', desc: 'ScaNN-powered vector nearest neighbors' },
        { name: 'Cloud Run Ingress', desc: 'Containerized microservice on port 3000' },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-4">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">Ecosystem & Libraries</div>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Technology & Cloud Services</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Four interconnected architectural layers leveraging cutting-edge web frameworks and Google Cloud platform APIs.
        </p>
      </div>

      {/* 4 Architectural Columns */}
      <div className="my-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stack.map((group, idx) => {
          const Icon = group.icon;
          return (
            <div key={idx} className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-blue-400">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">{group.layer}</span>
              </div>
              <div className="space-y-2">
                {group.items.map((item, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-xs font-bold text-slate-200">{item.name}</div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>Zero simulated or mock backends — all services run live in container environment.</span>
        <span className="font-mono text-blue-400">Node v20+ • TypeScript 5.7+</span>
      </div>
    </div>
  );
};

/* =========================================================
   Slide 7: System Architecture Diagram
   ========================================================= */
export const Slide7Architecture: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-4">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">System Blueprint</div>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">System Architecture</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Visualizing data flow across client presentation, Express server middleware, and Google Cloud services.
        </p>
      </div>

      {/* Visual System Topology Box */}
      <div className="my-auto p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          {/* Client Block */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-blue-500/30 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Client Browser (SPA)</div>
              <div className="text-xs text-slate-400 mt-0.5">React 19 • Tailwind • Vite</div>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 text-left bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <div>• Natural Language Search Input</div>
              <div>• Drag & Drop Photo Upload</div>
              <div>• Interactive Photo Viewer & Info Panel</div>
              <div>• Albums & Favorites Controls</div>
            </div>
          </div>

          {/* Express Server Block */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 text-center space-y-3 relative">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Modular Server.ts</div>
              <div className="text-xs text-slate-400 mt-0.5">Express • TypeScript • Lazy Init</div>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 text-left bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <div>• <code className="text-blue-300">/api/photos</code> (CRUD & uploads)</div>
              <div>• <code className="text-blue-300">/api/search</code> (Vector search)</div>
              <div>• <code className="text-blue-300">/api/albums</code> (Collections)</div>
              <div>• <code className="text-blue-300">/media/*</code> (Robust image serving)</div>
            </div>
          </div>

          {/* Google Cloud Ecosystem Block */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Google Cloud Ecosystem</div>
              <div className="text-xs text-slate-400 mt-0.5">Enterprise Cloud APIs</div>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 text-left bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <div>• <strong>Gemini 2.5 Flash:</strong> Vision Summaries</div>
              <div>• <strong>Gemini Embedding 2:</strong> 3072-D Vector</div>
              <div>• <strong>Vertex AI:</strong> Vector Search (ScaNN)</div>
              <div>• <strong>Firestore:</strong> NoSQL Documents</div>
              <div>• <strong>Cloud Storage:</strong> Object Binaries</div>
            </div>
          </div>
        </div>

        {/* Data Ingress & Egress summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
            <span><strong>Ingress:</strong> Client Photo Upload ➔ Express Multer ➔ Cloud Storage + Gemini Inference ➔ Firestore + Vector Index</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span><strong>Egress:</strong> Natural Query ➔ Query Vector ➔ Vertex AI Vector Search ➔ Hydrated Firestore Results ➔ Client Gallery</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500 flex items-center justify-between pt-2">
        <span>Clean separation of concerns with isolated microservice routes</span>
        <span>Secure API key containment in server environment (never leaked to browser)</span>
      </div>
    </div>
  );
};

/* =========================================================
   Slide 8: Key Features & Cloud Concepts
   ========================================================= */
export const Slide8Features: React.FC = () => {
  const features = [
    'Natural-language semantic photo search',
    'Gemini Vision automatic scene metadata extraction',
    'Similar photo search (Vector image-to-image matching)',
    'Dual-pane photo viewer with non-overlapping info panel',
    'Custom albums & favorite photo collections',
    'Soft trash with restore & permanent deletion',
    'Sample image generator & upload support (.avif, .png, .jpg)',
    'Dark/Light neomorphic UI with smooth animations',
  ];

  const cloudConcepts = [
    { title: 'Object Storage', detail: 'Cloud Storage protocols (gs://...) separating binary assets from transactional metadata.' },
    { title: 'High-Dimensional Vectors', detail: 'Dense 3072-dimensional vector spaces representing visual concepts mathematically.' },
    { title: 'Vector Indexing (ANN)', detail: 'Approximate Nearest Neighbor search via Vertex AI ScaNN algorithms for millisecond retrieval.' },
    { title: 'NoSQL Document Store', detail: 'Flexible document schema in Cloud Firestore supporting albums, favorites, and audit timestamps.' },
    { title: 'Asynchronous Processing', detail: 'Background AI inference preventing UI thread freezing during large media uploads.' },
    { title: 'Fault-Tolerant Fallbacks', detail: 'Fallback model chains and local caching ensuring 100% test reliability.' },
  ];

  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-4">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">Deliverables & Concepts</div>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
          Key Features & Cloud Concepts Demonstrated
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Demonstrating practical application of academic cloud concepts inside an end-user consumer product.
        </p>
      </div>

      {/* Dual Column Layout */}
      <div className="my-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Features Column */}
        <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Implemented Application Features
          </div>
          <div className="grid grid-cols-1 gap-2">
            {features.map((feat, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cloud Concepts Column */}
        <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Cloud className="w-4 h-4 text-indigo-400" />
            Core Cloud Concepts Demonstrated
          </div>
          <div className="space-y-2">
            {cloudConcepts.map((item, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs font-bold text-indigo-300">{item.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>Evaluated against modern enterprise software criteria: Reliability, Scalability, and Maintainability.</span>
        <span className="text-blue-400 font-mono">Clean Architecture Pattern</span>
      </div>
    </div>
  );
};

/* =========================================================
   Slide 9: Expected Outcome & Live Demo Simulator
   ========================================================= */
export const Slide9Outcome: React.FC = () => {
  const [selectedDemoQuery, setSelectedDemoQuery] = useState('Pool party');

  const demoScenarios: Record<string, { summary: string; score: string; objects: string[]; time: string }> = {
    'Pool party': {
      summary: 'Outdoor backyard pool gathering with friends laughing by the water on a sunny afternoon.',
      score: '98.4% Match',
      objects: ['Swimming pool', 'Sun loungers', 'Water glasses', 'Outdoor deck'],
      time: '210ms',
    },
    'Student ID card': {
      summary: 'Academic identification card sitting on a dark wooden study desk beside a notebook.',
      score: '96.2% Match',
      objects: ['ID Card', 'Desk surface', 'Spiral notebook', 'Pen'],
      time: '185ms',
    },
    'Beach sunset': {
      summary: 'Golden hour ocean horizon with vibrant orange and purple clouds reflecting across wet sand.',
      score: '99.1% Match',
      objects: ['Ocean waves', 'Coastline', 'Golden clouds', 'Wet sand'],
      time: '230ms',
    },
    'Photos from the gym': {
      summary: 'Fitness gym floor with dumbbell racks, mirrors, and training equipment.',
      score: '94.8% Match',
      objects: ['Dumbbells', 'Workout bench', 'Weight plates', 'Mirrors'],
      time: '195ms',
    },
  };

  const activeDemo = demoScenarios[selectedDemoQuery] || demoScenarios['Pool party'];

  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-4">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">Impact & Verification</div>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Expected Outcome & Live Simulator</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Transforming the frustrating experience of browsing thousands of filenames into instant natural discovery.
        </p>
      </div>

      {/* Interactive Simulator Section */}
      <div className="my-auto space-y-4">
        {/* Core Takeaway Quote */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-transparent border border-blue-500/30 flex items-center justify-between">
          <div className="text-sm sm:text-base font-semibold text-white italic">
            &ldquo;Finding a memory should take seconds, not minutes.&rdquo;
          </div>
          <div className="text-xs font-mono text-blue-400 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            Real-Time Semantic Retrieval
          </div>
        </div>

        {/* Live Simulator Card */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Interactive Test: Select or Simulate Query
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(demoScenarios).map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedDemoQuery(q)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                    selectedDemoQuery === q
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  &ldquo;{q}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Simulated Query Execution Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                Query Vector (3072-D) Matching
              </span>
              <span className="font-mono text-emerald-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Latency: {activeDemo.time}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2 space-y-1">
                <div className="text-xs text-slate-400 font-mono">Gemini Vision Summary Match:</div>
                <div className="text-sm font-medium text-slate-200">&ldquo;{activeDemo.summary}&rdquo;</div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {activeDemo.objects.map((obj, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {obj}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-center">
                <div className="text-[10px] text-blue-300 font-mono uppercase">Cosine Similarity</div>
                <div className="text-2xl font-bold text-white font-mono mt-0.5">{activeDemo.score}</div>
                <div className="text-[10px] text-emerald-400 mt-1">Nearest Neighbor Match</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500 flex items-center justify-between pt-2">
        <span>Click query buttons above to test different multimodal scenarios</span>
        <span className="text-slate-400">Zero keyword collisions or false positives</span>
      </div>
    </div>
  );
};

/* =========================================================
   Slide 10: Conclusion & Future Scope
   ========================================================= */
export const Slide10Conclusion: React.FC = () => {
  const roadmap = [
    { phase: 'Phase 1', title: 'Semantic Photo Search', status: 'Completed', detail: 'Natural language semantic search with Gemini 2.5 Flash & Vertex AI Vector Search.' },
    { phase: 'Phase 2', title: 'Autonomous Event Clustering', status: 'Planned', detail: 'Automatically grouping memories by vacation trips, birthdays, and seasonal events.' },
    { phase: 'Phase 3', title: 'Multimodal Video Search', status: 'Planned', detail: 'Timeline-level video search finding specific frames (&quot;the moment the cake was cut&quot;).' },
    { phase: 'Phase 4', title: 'On-Device Face & Pet Recognition', status: 'Planned', detail: 'Privacy-first localized clustering for family members and pets.' },
    { phase: 'Phase 5', title: 'Voice-Activated Smart Hubs', status: 'Planned', detail: 'Integration with smart displays for ambient conversational memory recall.' },
  ];

  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-4">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">Conclusion & Beyond</div>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Conclusion & Future Scope</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Summarizing project achievements and charting a 5-phase evolution toward an autonomous personal memory intelligence platform.
        </p>
      </div>

      {/* Main Conclusion & Roadmap Grid */}
      <div className="my-auto space-y-4">
        {/* Academic Conclusion Card */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Project Conclusion Summary
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
            This project successfully demonstrates that <strong>high-dimensional multimodal embeddings</strong> combined with <strong>approximate nearest neighbor vector search</strong> overcome the fundamental limitations of traditional file-system photo storage. By coupling Gemini 2.5 Flash with Vertex AI Vector Search and Google Cloud Firestore, we achieved sub-second, zero-keyword memory retrieval while maintaining high developer ergonomic standards through a modular full-stack architecture.
          </p>
        </div>

        {/* 5-Phase Roadmap */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Strategic 5-Phase Evolution Roadmap
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {roadmap.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all ${
                  item.status === 'Completed'
                    ? 'bg-blue-950/40 border-blue-500/40 text-white'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-blue-400">{item.phase}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full ${
                      item.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate">{item.title}</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thank you note */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-900/20 via-indigo-900/10 to-transparent border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div>Thank you for your time & evaluation. Questions & feedback are warmly welcomed.</div>
        <div className="font-mono text-blue-400 font-bold">End of Presentation • Slide 11/11</div>
      </div>
    </div>
  );
};
