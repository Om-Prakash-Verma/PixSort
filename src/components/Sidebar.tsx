import React, { useState } from 'react';
import {
  Image,
  Heart,
  FolderHeart,
  Clock,
  Trash2,
  HardDrive,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { SystemStatus } from '../types.js';
import { AuthUser } from './AuthModal.js';

export type ActiveTab = 'photos' | 'favorites' | 'albums' | 'recent' | 'trash' | 'storage';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  favoritesCount: number;
  trashCount: number;
  albumsCount: number;
  systemStatus: SystemStatus | null;
  onOpenPresentation?: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const formatStorage = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 GB';
  const tb = bytes / (1024 * 1024 * 1024 * 1024);
  if (tb >= 1) return `${tb.toFixed(1)} TB`;
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${Math.round(mb)} MB`;
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  favoritesCount,
  trashCount,
  albumsCount,
  systemStatus,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const compact = isCollapsed && !isMobileOpen;

  const libraryItems = [
    {
      id: 'photos' as ActiveTab,
      label: 'Photos',
      icon: Image,
      count: systemStatus?.totalPhotosCount,
    },
    { id: 'favorites' as ActiveTab, label: 'Favorites', icon: Heart, count: favoritesCount },
    { id: 'albums' as ActiveTab, label: 'Albums', icon: FolderHeart, count: albumsCount },
    { id: 'recent' as ActiveTab, label: 'Recently Added', icon: Clock },
  ];

  const manageItems = [
    {
      id: 'storage' as ActiveTab,
      label: 'Connected Storage',
      icon: HardDrive,
      count: systemStatus?.googleDriveActiveCount,
    },
    { id: 'trash' as ActiveTab, label: 'Trash', icon: Trash2, count: trashCount },
  ];

  const usedBytes = systemStatus?.googleDriveUsedStorage ?? 0;
  const totalBytes = systemStatus?.googleDriveTotalStorage ?? 0;
  const usagePct = totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 100)) : 0;

  const renderNavButton = (item: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => {
          onTabChange(item.id);
          onCloseMobile?.();
        }}
        title={compact ? item.label : undefined}
        className={`w-full flex items-center ${
          compact ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
        } rounded-2xl text-xs transition-all cursor-pointer ${
          isActive
            ? 'neo-inset text-blue-700 font-bold'
            : 'text-slate-600 font-medium hover:bg-white/55 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
          {!compact && <span className="truncate">{item.label}</span>}
        </div>
        {!compact && item.count !== undefined && item.count > 0 && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full tabular-nums ${
              isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200/80 text-slate-600'
            }`}
          >
            {item.count}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`sidebar shrink-0 bg-[#EEF2F6] neo-raised rounded-3xl border border-white/70 flex-col justify-between overflow-y-auto shadow-sm transition-all duration-200 ${
          compact ? 'w-[76px] p-3' : 'w-64 p-4'
        } ${
          isMobileOpen
            ? 'fixed inset-y-3 left-3 z-50 flex max-h-[calc(100vh-1.5rem)] w-64 p-4'
            : 'hidden md:flex my-4 ml-4 mb-4 sticky top-4 self-start max-h-[calc(100vh-5.5rem)] z-20'
        }`}
      >
        {/* Navigation Groups */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div
              className={`flex items-center ${
                compact ? 'justify-center' : 'justify-between px-2.5'
              } py-1`}
            >
              {!compact && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Library
                </span>
              )}
              {isMobileOpen && onCloseMobile ? (
                <button
                  onClick={onCloseMobile}
                  className="md:hidden p-1.5 rounded-xl neo-btn text-slate-500"
                  aria-label="Close navigation menu"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsCollapsed((c) => !c)}
                  className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors cursor-pointer"
                  title={compact ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {compact ? (
                    <PanelLeftOpen className="w-4 h-4" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            {libraryItems.map(renderNavButton)}
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-200/70">
            {!compact && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                Manage
              </div>
            )}
            {manageItems.map(renderNavButton)}
          </div>
        </div>

        {/* Visual Google Drive Storage Pool Meter */}
        <div className="mt-6">
          {compact ? (
            <button
              onClick={() => onTabChange('storage')}
              title={`Storage Pool: ${formatStorage(usedBytes)} / ${formatStorage(totalBytes)} (${usagePct}%)`}
              className="w-full p-2.5 rounded-2xl neo-raised-sm flex flex-col items-center gap-1.5 hover:text-blue-700 cursor-pointer"
            >
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span className="text-[9px] font-bold text-slate-600 tabular-nums">{usagePct}%</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onTabChange('storage');
                onCloseMobile?.();
              }}
              className="w-full text-left p-3.5 rounded-2xl neo-raised-sm hover:bg-white/40 transition-colors space-y-2.5 cursor-pointer"
              title="Open Connected Storage"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                  Storage Pool
                </span>
                <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
                  {usagePct}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full neo-inset-sm overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300"
                  style={{ width: `${Math.max(usagePct, totalBytes > 0 ? 4 : 0)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-medium tabular-nums">
                  {formatStorage(usedBytes)} / {formatStorage(totalBytes)}
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {systemStatus?.indexedVectorsCount ?? 0} indexed
                </span>
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
