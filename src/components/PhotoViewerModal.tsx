import React, { useState, useEffect } from 'react';
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
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [photo?.id]);

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
  }, [photo, allPhotos]);

  if (!photo) return null;

  const currentIndex = allPhotos.findIndex((p) => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allPhotos.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectPhoto(allPhotos[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onSelectPhoto(allPhotos[currentIndex + 1]);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = photo.filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 text-white transition-colors"
            title="Close viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <div className="text-sm font-semibold tracking-tight">{photo.filename}</div>
            <div className="text-[11px] text-slate-300">
              {currentIndex + 1} of {allPhotos.length}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          {/* Find Similar Button */}
          <button
            onClick={() => onFindSimilar(photo)}
            className="px-3 py-2 rounded-2xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
            title="Find Similar Photos via Vertex AI Vector Search"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Find Similar</span>
          </button>

          {/* Zoom Toggle */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 text-white transition-colors"
            title={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          {/* Favorite Toggle */}
          <button
            onClick={(e) => onToggleFavorite(photo, e)}
            className={`p-2.5 rounded-2xl transition-colors ${
              photo.isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800/80 hover:bg-slate-700/90 text-white'
            }`}
            title={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${photo.isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Add to Album Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAlbumMenu(!showAlbumMenu)}
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 text-white transition-colors"
              title="Add to Album"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            {showAlbumMenu && (
              <div className="absolute right-0 mt-2 w-48 p-2 rounded-2xl neo-raised-lg bg-[#EEF2F6] text-slate-800 z-30 shadow-xl border border-white/60">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Assign Albums
                </div>
                {albums.length === 0 ? (
                  <p className="text-xs text-slate-500 p-2">No albums yet</p>
                ) : (
                  albums.map((alb) => {
                    const isAssigned = photo.albumIds.includes(alb.id);
                    return (
                      <button
                        key={alb.id}
                        onClick={() => onToggleAlbum(photo, alb.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                          isAssigned ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{alb.name}</span>
                        {isAssigned && <span className="text-[10px] font-bold">✓</span>}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 text-white transition-colors"
            title="Download original"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Delete / Trash */}
          <button
            onClick={() => onDeletePhoto(photo)}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-rose-900/90 text-white hover:text-rose-200 transition-colors"
            title="Move to Trash"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Info Drawer Toggle */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2.5 rounded-2xl transition-colors ${
              showInfo ? 'bg-blue-600 text-white' : 'bg-slate-800/80 hover:bg-slate-700/90 text-white'
            }`}
            title="Toggle AI photo details (I)"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport & Navigation Buttons */}
      <div className="relative flex-1 h-full flex items-center justify-center p-4 sm:p-8 overflow-hidden select-none">
        {/* Previous Button */}
        {hasPrev && (
          <button
            onClick={handlePrev}
            className="absolute left-4 z-20 p-3 rounded-2xl bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md transition-transform hover:scale-105"
            title="Previous (Left arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-4 sm:right-auto sm:left-[calc(100%-80px)] z-20 p-3 rounded-2xl bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md transition-transform hover:scale-105"
            style={showInfo ? { right: '340px', left: 'auto' } : {}}
            title="Next (Right arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Actual Image or Fallback */}
        <div
          className={`transition-all duration-300 flex items-center justify-center max-h-[85vh] ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => !imageError && setIsZoomed(!isZoomed)}
        >
          {imageError ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-slate-900/90 border border-slate-700/60 text-slate-300 max-w-md text-center shadow-2xl">
              <div className="p-4 rounded-2xl bg-slate-800 text-slate-400 mb-4 shadow-inner">
                <ImageIcon className="w-10 h-10" />
              </div>
              <h4 className="text-base font-semibold text-white mb-1">{photo.filename}</h4>
              <p className="text-xs text-slate-400 mb-4 max-w-xs">
                The image binary for this photo was uploaded in a previous session or remote environment. Its AI visual metadata and vector embeddings remain fully searchable.
              </p>
              <div className="px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-[11px] text-blue-300 font-medium">
                Indexed in Vertex AI Vector Search
              </div>
            </div>
          ) : (
            <img
              src={photo.url}
              alt={photo.aiDescription}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl transition-transform"
            />
          )}
        </div>
      </div>

      {/* AI Metadata & Details Drawer */}
      {showInfo && (
        <aside className="w-80 sm:w-96 shrink-0 h-full bg-[#EEF2F6] border-l border-slate-200/80 p-5 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200 z-30">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Photo Details & AI Metadata
            </h3>
            <button
              onClick={() => setShowInfo(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* AI Semantic Description (Generated by Gemini) */}
          <div className="p-4 rounded-2xl neo-inset space-y-2">
            <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini Vision Summary
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              &ldquo;{photo.aiDescription}&rdquo;
            </p>
          </div>

          {/* Standard Metadata */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Date & Location
            </div>

            <div className="p-3.5 rounded-2xl neo-raised space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date Taken
                </span>
                <span className="font-semibold text-slate-800">{photo.dateTaken}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Location
                </span>
                <span className="font-semibold text-slate-800">{photo.location}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Time of Day
                </span>
                <span className="font-semibold text-slate-800">{photo.time}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  Environment
                </span>
                <span className="font-semibold text-slate-800">{photo.environment}</span>
              </div>
            </div>
          </div>

          {/* Detected Objects */}
          {photo.objects && photo.objects.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Detected Objects
              </div>
              <div className="flex flex-wrap gap-1.5">
                {photo.objects.map((obj, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-700 neo-btn"
                  >
                    {obj}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detected Activities */}
          {photo.activities && photo.activities.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Detected Activities
              </div>
              <div className="flex flex-wrap gap-1.5">
                {photo.activities.map((act, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-blue-700 bg-blue-50/80 border border-blue-200/50"
                  >
                    {act}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vector Search Stats */}
          <div className="p-3.5 rounded-2xl neo-raised border border-white/60 space-y-2">
            <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              Vertex AI Vector Search Index
            </div>
            <div className="text-[11px] text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Embedding Model:</span>
                <span className="font-mono text-slate-800">Gemini Embedding 2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vector Dimension:</span>
                <span className="font-mono text-slate-800">
                  {photo.embeddingDimension || 768}-D Dense
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Storage Path:</span>
                <span className="font-mono text-[10px] text-slate-600 truncate max-w-[170px]">
                  {photo.storagePath}
                </span>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
