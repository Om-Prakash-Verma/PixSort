import React, { useMemo, useState } from 'react';
import { Calendar, Filter, Sparkles, ArrowUpDown, Heart, MapPin, SearchX } from 'lucide-react';
import { Photo, SearchInterpretedFilter } from '../types.js';
import { PhotoCard } from './PhotoCard.js';

interface PhotoGridProps {
  photos: Photo[];
  isSearchResult: boolean;
  searchQuery?: string;
  interpretedFilter?: SearchInterpretedFilter;
  executionTimeMs?: number;
  onSelectPhoto: (photo: Photo) => void;
  onToggleFavorite: (photo: Photo, e: React.MouseEvent) => void;
  onFindSimilar: (photo: Photo, e: React.MouseEvent) => void;
  onClearSearch?: () => void;
  title?: string;
}

type SortOption = 'relevance' | 'date-desc' | 'date-asc';

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  isSearchResult,
  searchQuery,
  interpretedFilter,
  executionTimeMs,
  onSelectPhoto,
  onToggleFavorite,
  onFindSimilar,
  onClearSearch,
  title,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Extract unique locations
  const availableLocations = useMemo(() => {
    const locs = new Set<string>();
    photos.forEach((p) => {
      if (p.location) locs.add(p.location);
    });
    return Array.from(locs);
  }, [photos]);

  // Apply in-view sorting & filtering
  const processedPhotos = useMemo(() => {
    let list = [...photos];

    if (filterFavoritesOnly) {
      list = list.filter((p) => p.isFavorite);
    }

    if (selectedLocation !== 'all') {
      list = list.filter((p) => p.location.toLowerCase().includes(selectedLocation.toLowerCase()));
    }

    if (sortBy === 'relevance' && isSearchResult) {
      list.sort((a, b) => (b.similarityScore ?? 0) - (a.similarityScore ?? 0));
    } else if (sortBy === 'date-desc') {
      list.sort((a, b) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime());
    } else if (sortBy === 'date-asc') {
      list.sort((a, b) => new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime());
    }

    return list;
  }, [photos, sortBy, filterFavoritesOnly, selectedLocation, isSearchResult]);

  // Group by date when NOT a search result (as requested in Section 10)
  const groupedByDate = useMemo(() => {
    if (isSearchResult) return null;

    const groups: { [date: string]: Photo[] } = {};
    for (const photo of processedPhotos) {
      const date = photo.dateTaken;
      if (!groups[date]) groups[date] = [];
      groups[date].push(photo);
    }

    // Format readable date headers
    return Object.entries(groups).map(([dateStr, items]) => {
      const dateObj = new Date(dateStr);
      const formatted = isNaN(dateObj.getTime())
        ? dateStr
        : dateObj.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
      return {
        dateStr,
        formatted,
        items,
      };
    });
  }, [processedPhotos, isSearchResult]);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl neo-raised flex items-center justify-center text-slate-400 mb-4">
          <SearchX className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-700 mb-1">No matching photos found</h3>
        <p className="text-xs text-slate-500 max-w-sm mb-5">
          {isSearchResult
            ? `Vertex AI Vector Search did not find photos with sufficient semantic match for "${searchQuery}". Try broader natural language words.`
            : 'No photos in this section yet. Click Upload to add your first photo.'}
        </p>
        {isSearchResult && onClearSearch && (
          <button
            onClick={onClearSearch}
            className="px-4 py-2 rounded-2xl neo-btn text-xs font-semibold text-blue-700"
          >
            Clear Search & View All Photos
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Result Header / Filter Bar */}
      {isSearchResult && (
        <div className="p-4 rounded-2xl neo-raised border border-white/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  Search results for &ldquo;{searchQuery}&rdquo;
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {processedPhotos.length} {processedPhotos.length === 1 ? 'photo' : 'photos'}
                </span>
                {executionTimeMs !== undefined && (
                  <span className="text-[11px] text-slate-400">({executionTimeMs} ms)</span>
                )}
              </div>
              {interpretedFilter && (
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Semantic:
                  </span>
                  <span className="bg-slate-200/80 px-2 py-0.5 rounded-lg text-slate-800 font-mono text-[11px]">
                    &ldquo;{interpretedFilter.semanticQuery}&rdquo;
                  </span>
                  {interpretedFilter.dateFilter && (
                    <span className="bg-blue-100/70 text-blue-800 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                      Date filter: {interpretedFilter.dateFilter}
                    </span>
                  )}
                  {interpretedFilter.locationFilter && (
                    <span className="bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                      Location filter: {interpretedFilter.locationFilter}
                    </span>
                  )}
                  {interpretedFilter.favoriteOnly && (
                    <span className="bg-rose-100/70 text-rose-800 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                      Favorites only
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* In-view Sort & Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-slate-500 bg-[#EEF2F6] px-2.5 py-1.5 rounded-xl neo-inset-sm">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                </select>
              </div>

              {availableLocations.length > 1 && (
                <div className="flex items-center gap-1 text-xs text-slate-500 bg-[#EEF2F6] px-2.5 py-1.5 rounded-xl neo-inset-sm">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Locations</option>
                    {availableLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  filterFavoritesOnly
                    ? 'neo-inset text-rose-600 font-bold'
                    : 'neo-btn text-slate-600 hover:text-slate-900'
                }`}
                title="Filter favorites"
              >
                <Heart className={`w-3.5 h-3.5 ${filterFavoritesOnly ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Favorites</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Date Grouped Layout (when not search) */}
      {!isSearchResult && groupedByDate ? (
        <div className="space-y-8">
          {title && (
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
          )}
          {groupedByDate.map((group) => (
            <section key={group.dateStr} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700 tracking-tight">
                  {group.formatted}
                </h3>
                <span className="text-[11px] text-slate-400">
                  ({group.items.length} {group.items.length === 1 ? 'photo' : 'photos'})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.items.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onSelect={onSelectPhoto}
                    onToggleFavorite={onToggleFavorite}
                    onFindSimilar={onFindSimilar}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* Flat Grid for Search Results */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {processedPhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onSelect={onSelectPhoto}
              onToggleFavorite={onToggleFavorite}
              onFindSimilar={onFindSimilar}
            />
          ))}
        </div>
      )}
    </div>
  );
};
