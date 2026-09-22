import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Play,
  Pause,
  Home,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Slide0Team,
  Slide1Synopsis,
  Slide2Pipeline,
  Slide3Problem,
  Slide4Objectives,
  Slide5Methodology,
  Slide6TechStack,
  Slide7Architecture,
  Slide8Features,
  Slide9Outcome,
  Slide10Conclusion,
} from './PresentationSlides.js';

interface PresentationDeckProps {
  onExit: () => void;
}

const TOTAL_SLIDES = 11;

const SLIDE_TITLES = [
  'Team & Project Overview',
  'Synopsis & Overview',
  'Processing Pipeline',
  'Problem Statement',
  'Project Objectives',
  'Proposed Methodology',
  'Tech Stack & Services',
  'System Architecture',
  'Features & Cloud Concepts',
  'Expected Outcome & Demo',
  'Conclusion & Future Scope',
];

export const PresentationDeck: React.FC<PresentationDeckProps> = ({ onExit }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev < TOTAL_SLIDES - 1 ? prev + 1 : prev));
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentSlide(TOTAL_SLIDES - 1);
      } else if (e.key === 'Escape') {
        if (showThumbnails) {
          setShowThumbnails(false);
        } else {
          onExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onExit, showThumbnails]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev < TOTAL_SLIDES - 1 ? prev + 1 : 0));
    }, 12000);
    return () => clearInterval(timer);
  }, [isAutoPlay]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const renderCurrentSlide = () => {
    switch (currentSlide) {
      case 0:
        return <Slide0Team />;
      case 1:
        return <Slide1Synopsis />;
      case 2:
        return <Slide2Pipeline />;
      case 3:
        return <Slide3Problem />;
      case 4:
        return <Slide4Objectives />;
      case 5:
        return <Slide5Methodology />;
      case 6:
        return <Slide6TechStack />;
      case 7:
        return <Slide7Architecture />;
      case 8:
        return <Slide8Features />;
      case 9:
        return <Slide9Outcome />;
      case 10:
        return <Slide10Conclusion />;
      default:
        return <Slide0Team />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0D14] text-slate-100 flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Top Slide Progress Bar */}
      <div className="w-full h-1 bg-slate-900 shrink-0 relative overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400"
          initial={false}
          animate={{ width: `${((currentSlide + 1) / TOTAL_SLIDES) * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Top Header Controls Bar */}
      <header className="px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-900 bg-slate-950/70 backdrop-blur-md shrink-0 z-20">
        {/* Left: Project Brand & Current Slide Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                pix sort
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Image Upload & Auto-Processing
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Slide {currentSlide + 1} of {TOTAL_SLIDES}:{' '}
              <span className="text-slate-200 font-medium">{SLIDE_TITLES[currentSlide]}</span>
            </div>
          </div>
        </div>

        {/* Right: Presentation Tools */}
        <div className="flex items-center gap-2">
          {/* Overview Grid Toggle */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showThumbnails
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title="Overview of all slides"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Slides</span>
          </button>

          {/* Autoplay Toggle */}
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isAutoPlay
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title={isAutoPlay ? 'Pause auto-advance' : 'Auto-advance slides'}
          >
            {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="hidden sm:inline">{isAutoPlay ? 'Playing' : 'Autoplay'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit to Main App Button */}
          <button
            onClick={onExit}
            className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20"
            title="Exit presentation and return to Photo App (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Back to App</span>
          </button>
        </div>
      </header>

      {/* Main Slide Stage (Responsive 16:9 Presentation Frame) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-6 flex flex-col justify-center min-h-0 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="h-full w-full flex flex-col"
          >
            {renderCurrentSlide()}
          </motion.div>
        </AnimatePresence>

        {/* Slide Overview Thumbnail Drawer / Overlay */}
        {showThumbnails && (
          <div className="absolute inset-0 bg-[#0A0D14]/95 backdrop-blur-md z-30 p-6 overflow-y-auto animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Slide Index</h3>
                <p className="text-xs text-slate-400">Click any slide to jump directly</p>
              </div>
              <button
                onClick={() => setShowThumbnails(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {SLIDE_TITLES.map((title, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentSlide(idx);
                    setShowThumbnails(false);
                  }}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    currentSlide === idx
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/50'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-[11px] font-mono text-blue-400 mb-1">
                    Slide {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="text-xs font-bold truncate text-white">{title}</div>
                  <div className="text-[10px] text-slate-400 mt-2 font-mono">Jump ➔</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Floating Navigation Bar */}
      <footer className="px-4 sm:px-8 py-3.5 border-t border-slate-900 bg-slate-950/70 backdrop-blur-md shrink-0 flex items-center justify-between z-20">
        {/* Left: Quick Jump / First Slide */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide(0)}
            disabled={currentSlide === 0}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 border border-slate-800 text-xs flex items-center gap-1.5 transition-colors"
            title="First slide (Home)"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">First</span>
          </button>
        </div>

        {/* Center: Slide Numbers & Direct Jump Dots */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white border border-slate-800 transition-colors"
            title="Previous slide (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Slide Dots / Pill */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all ${
                  currentSlide === idx
                    ? 'w-6 h-2 rounded-full bg-blue-500'
                    : 'w-2 h-2 rounded-full bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Jump to slide ${idx + 1}`}
              />
            ))}
            <span className="text-xs font-mono text-slate-400 ml-2 pl-2 border-l border-slate-800">
              {String(currentSlide + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(TOTAL_SLIDES).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentSlide === TOTAL_SLIDES - 1}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-colors"
            title="Next slide (Right Arrow / Space)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Keyboard Shortcuts Hint */}
        <div className="text-[11px] text-slate-500 font-mono hidden md:flex items-center gap-3">
          <span>Navigate: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">→</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Space</kbd></span>
          <span>Exit: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Esc</kbd></span>
        </div>
      </footer>
    </div>
  );
};
