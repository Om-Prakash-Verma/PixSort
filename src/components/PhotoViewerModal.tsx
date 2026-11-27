import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
  FolderPlus,
  Sparkles,
  Info,
  MapPin,
  Calendar,
  Layers,
  Clock,
  Compass,
  Tag,
  Activity,
  Cpu,
  Image as ImageIcon,
  Check,
  HardDrive,
  ChevronDown,
} from 'lucide-react';
import { Photo, Album } from '../types.js';

interface PhotoViewerModalProps {
  photo: Photo | null;
  allPhotos: Photo[];
  albums: Album[];
  onClose: () => void;
  onSelectPhoto: (photo: Photo) => void;
  onToggleFavorite: (photo: Photo, e: React.MouseEvent) => void;
  onDeletePhoto: (photo: Photo) => void;
  onToggleAlbum: (photo: Photo, albumId: string) => void;
  onFindSimilar: (photo: Photo) => void;
}

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  photo,
  allPhotos,
  albums,
  onClose,
  onSelectPhoto,
  onToggleFavorite,
  onDeletePhoto,
  onToggleAlbum,
  onFindSimilar,
}) => {
  const [showInfo, setShowInfo] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showAlbumMenu, setShowAlbumMenu] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    setIsZoomed(false);
    setShowAlbumMenu(false);
  }, [photo?.id]);

  const currentIndex = photo ? allPhotos.findIndex((p) => p.id === photo.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allPhotos.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectPhoto(allPhotos[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onSelectPhoto(allPhotos[currentIndex + 1]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!photo) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'i' || e.key === 'I') setShowInfo((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, currentIndex, allPhotos]);

  if (!photo) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = photo.filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formattedSize = formatBytes(photo.fileSize);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col md:flex-row bg-[#EEF2F6] text-slate-800 overflow-hidden select-none"
    >
      {/* 1. Editorial Light Gallery Stage */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
        {/* Top Gallery Header */}
        <header className="w-full px-4 sm:px-7 pt-4 pb-2 flex items-center justify-between gap-4 shrink-0 z-20">
          {/* Left: Close + Clean Gallery Index Pill */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full neo-btn flex items-center justify-center text-slate-600 hover:text-slate-900 shrink-0"
              title="Close viewer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-4 py-1.5 rounded-full neo-inset-sm flex items-center gap-2.5 text-xs">
              <span className="font-bold text-slate-700 tabular-nums">
                {currentIndex + 1} <span className="text-slate-400 font-medium">of</span> {allPhotos.length}
              </span>
              {photo.dateTaken && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="hidden sm:inline font-medium text-slate-500">
                    {photo.dateTaken}
                  </span>
                </>
              )}
              {formattedSize && (
                <>
                  <span className="hidden md:inline w-1 h-1 rounded-full bg-slate-300" />
                  <span className="hidden md:inline font-mono text-[11px] text-slate-400">
                    {formattedSize}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Zoom & Inspector Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsZoomed((z) => !z)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isZoomed ? 'neo-btn neo-btn-active text-blue-600' : 'neo-btn text-slate-600 hover:text-slate-900'
              }`}
              title={isZoomed ? 'Zoom out' : 'Zoom in'}
            >
              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowInfo((v) => !v)}
              className={`px-4 py-2.5 rounded-full flex items-center gap-2 text-xs font-semibold transition-all ${
                showInfo ? 'neo-btn-primary' : 'neo-btn text-slate-700'
              }`}
              title="Toggle AI Inspector (I)"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showInfo ? 'Hide Inspector' : 'AI Inspector'}</span>
            </button>
          </div>
        </header>

        {/* Center Gallery Mat & Print Frame */}
        <div className="relative flex-1 flex items-center justify-center px-4 sm:px-14 py-2 min-h-0 overflow-hidden">
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-3 sm:left-6 z-20 w-11 h-11 rounded-full neo-btn flex items-center justify-center text-slate-700 hover:text-blue-600 hover:scale-105 active:scale-95"
              title="Previous (Left arrow)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-3 sm:right-6 z-20 w-11 h-11 rounded-full neo-btn flex items-center justify-center text-slate-700 hover:text-blue-600 hover:scale-105 active:scale-95"
              title="Next (Right arrow)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: isZoomed ? 1.45 : 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => !imageError && setIsZoomed((z) => !z)}
              className={`relative flex items-center justify-center max-h-full max-w-full ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            >
              {imageError ? (
                <div className="flex flex-col items-center justify-center p-10 rounded-3xl neo-raised-lg text-slate-600 max-w-md text-center">
                  <div className="p-4 rounded-2xl neo-inset text-slate-400 mb-4">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Preview Unavailable</h4>
                  <p className="text-xs text-slate-500 mb-4 max-w-xs leading-relaxed">
                    Photo metadata and 3072-D vector embeddings remain indexed and searchable.
                  </p>
                  <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 font-semibold">
                    Indexed in Vertex AI Vector Search
                  </div>
                </div>
              ) : (
                /* Tactile Gallery Mat Frame */
                <div className="p-2.5 sm:p-3.5 rounded-3xl neo-raised-lg bg-[#EEF2F6]">
                  <img
                    src={photo.url}
                    alt={photo.aiDescription}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="max-h-[calc(100vh-245px)] max-w-full object-contain rounded-2xl shadow-sm"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Filmstrip + Floating Tactile Action Dock */}
        <div className="w-full px-4 pb-4 pt-1 flex flex-col items-center gap-2.5 shrink-0 z-20">
          {/* Compact Thumbnail Filmstrip */}
          {allPhotos.length > 1 && (
            <div className="max-w-full sm:max-w-xl px-2 py-1.5 rounded-2xl neo-inset-sm flex items-center gap-1.5 overflow-x-auto">
              {allPhotos.map((item) => {
                const isActive = item.id === photo.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectPhoto(item)}
                    className={`relative w-10 h-10 rounded-xl overflow-hidden shrink-0 transition-all ${
                      isActive
                        ? 'ring-2 ring-blue-600 scale-105 shadow-md'
                        : 'opacity-55 hover:opacity-100'
                    }`}
                    title={item.dateTaken || item.filename}
                  >
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Tactile Action Bar */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 rounded-full neo-raised max-w-full overflow-x-auto">
            <button
              onClick={() => onFindSimilar(photo)}
              className="px-4 py-2 rounded-full neo-btn-primary text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Find Similar Photos via Vector Search"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Find Similar</span>
            </button>

            <button
              onClick={(e) => onToggleFavorite(photo, e)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                photo.isFavorite
                  ? 'bg-rose-50 text-rose-600'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
              title={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-3.5 h-3.5 ${photo.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="hidden sm:inline">{photo.isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            {/* Album Popover */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowAlbumMenu((v) => !v)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showAlbumMenu
                    ? 'bg-white/80 text-blue-600'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                }`}
                title="Add to Album"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Album</span>
              </button>

              <AnimatePresence>
                {showAlbumMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 bottom-full mb-3 w-56 p-2.5 rounded-2xl neo-raised-lg bg-[#EEF2F6] text-slate-800 z-30"
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                      Assign Albums
                    </div>
                    {albums.length === 0 ? (
                      <p className="text-xs text-slate-500 px-2 py-2">No albums yet</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {albums.map((alb) => {
                          const isAssigned = photo.albumIds.includes(alb.id);
                          return (
                            <button
                              key={alb.id}
                              onClick={() => onToggleAlbum(photo, alb.id)}
                              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                                isAssigned
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'hover:bg-slate-200/70 text-slate-700'
                              }`}
                            >
                              <span className="truncate">{alb.name}</span>
                              {isAssigned && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-full text-slate-600 hover:bg-white/60 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              title="Download original"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download</span>
            </button>

            <div className="w-px h-5 bg-slate-300/80 mx-0.5 shrink-0" />

            <button
              onClick={() => onDeletePhoto(photo)}
              className="px-3.5 py-2 rounded-full text-slate-500 hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              title="Move to Trash"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Floating Tactile Neomorphic AI Inspector */}
      <AnimatePresence>
        {showInfo && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30"
              onClick={() => setShowInfo(false)}
            />

            <motion.aside
              initial={{ x: 32, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 32, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full md:w-[350px] lg:w-[380px] shrink-0 h-[78vh] md:h-[calc(100%-2rem)] md:my-4 md:mr-4 bg-[#EEF2F6] neo-raised-lg p-5 sm:p-6 overflow-y-auto space-y-5 fixed md:relative bottom-0 inset-x-0 md:bottom-auto md:inset-x-auto z-40 rounded-t-3xl md:rounded-3xl"
            >
              {/* Mobile drag handle */}
              <div className="md:hidden w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-1" />

              {/* Inspector Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl neo-raised-sm flex items-center justify-center text-blue-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">
                      AI Inspector
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Gemini Vision & Vector Metadata
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="w-8 h-8 rounded-full neo-btn flex items-center justify-center text-slate-500 hover:text-slate-800"
                  title="Close Inspector (I)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Gemini Vision Summary */}
              <div className="p-4 rounded-2xl neo-inset space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Gemini Vision Summary
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-700">
                    3.5 Flash Lite
                  </span>
                </div>
                <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                  &ldquo;{photo.aiDescription}&rdquo;
                </p>
              </div>

              {/* 2x2 Context & Capture Bento */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
                  Context & Capture
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl neo-raised-sm space-y-1">
                    <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 uppercase tracking-wide">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      Date
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate" title={photo.dateTaken}>
                      {photo.dateTaken}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl neo-raised-sm space-y-1">
                    <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 uppercase tracking-wide">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      Location
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate" title={photo.location}>
                      {photo.location}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl neo-raised-sm space-y-1">
                    <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 uppercase tracking-wide">
                      <Clock className="w-3 h-3 text-amber-500" />
                      Time
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate" title={photo.time}>
                      {photo.time}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl neo-raised-sm space-y-1">
                    <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 uppercase tracking-wide">
                      <Compass className="w-3 h-3 text-emerald-500" />
                      Setting
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate" title={photo.environment}>
                      {photo.environment}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detected Objects */}
              {photo.objects && photo.objects.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                    <Tag className="w-3 h-3" />
                    Detected Objects
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {photo.objects.map((obj, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 bg-white/75 border border-slate-200/80 shadow-xs"
                      >
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected Activities */}
              {photo.activities && photo.activities.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                    <Activity className="w-3 h-3" />
                    Detected Activities
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {photo.activities.map((act, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-700 bg-blue-500/10 border border-blue-500/20"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Collapsible Technical & Storage Index */}
              <div className="rounded-2xl neo-raised-sm overflow-hidden">
                <button
                  onClick={() => setShowTechDetails((v) => !v)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/30 transition-colors"
                >
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    Vector & Storage Details
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-[10px] font-mono font-semibold text-slate-700">
                      {photo.embeddingDimension || 3072}-D
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        showTechDetails ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {showTechDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3.5 pt-2 space-y-2 text-[11px] border-t border-slate-200/70">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 shrink-0">Filename</span>
                          <span
                            className="font-mono text-slate-700 text-[10px] truncate max-w-[180px]"
                            title={photo.filename}
                          >
                            {photo.filename}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Embedding</span>
                          <span className="font-mono font-medium text-slate-800">
                            Gemini Embedding 2
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Storage</span>
                          <span className="font-semibold text-blue-700 flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            Google Drive API
                          </span>
                        </div>
                        {photo.driveAccountEmail && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 shrink-0">Account</span>
                            <span
                              className="font-mono text-slate-700 text-[10px] truncate max-w-[180px]"
                              title={photo.driveAccountEmail}
                            >
                              {photo.driveAccountEmail}
                            </span>
                          </div>
                        )}
                        {photo.driveFileId && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 shrink-0">File ID</span>
                            <span
                              className="font-mono text-[10px] text-slate-500 truncate max-w-[180px]"
                              title={photo.driveFileId}
                            >
                              {photo.driveFileId}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 shrink-0">Path</span>
                          <span
                            className="font-mono text-[10px] text-slate-500 truncate max-w-[180px]"
                            title={photo.storagePath}
                          >
                            {photo.storagePath}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
