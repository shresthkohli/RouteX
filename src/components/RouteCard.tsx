'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bus, Bookmark, ChevronDown, ChevronUp, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { BusRouteOverview } from '@/lib/types';

interface RouteCardProps {
  route: BusRouteOverview;
  onFavoriteSuccess?: () => void;
}

export default function RouteCard({ route, onFavoriteSuccess }: RouteCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getRouteBadgeStyle = (type: string) => {
    switch (type) {
      case 'BRTS':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Electric':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'City Bus':
      default:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    }
  };

  const handleSaveFavorite = async () => {
    setFavoriteLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route_id: route.route_id }),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save route');
      }

      setIsFavorited(true);
      if (onFavoriteSuccess) {
        onFavoriteSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving favorite');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const sortedStops = [...(route.stops || [])].sort((a, b) => a.seq_no - b.seq_no);

  return (
    <div className="rounded-2xl p-6 shadow-sm bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:bg-slate-800/70 hover:border-slate-700 transition-all duration-200">
      {/* Route Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 font-mono font-bold text-lg text-emerald-400">
            {route.route_number}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getRouteBadgeStyle(
                  route.route_type
                )}`}
              >
                {route.route_type}
              </span>
              <span className="text-xs text-slate-400">
                {route.stops?.length || 0} stops
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">
              {route.route_name}
            </h3>
          </div>
        </div>

        {/* Save Route Bookmark Button */}
        <button
          onClick={handleSaveFavorite}
          disabled={favoriteLoading || isFavorited}
          title={isFavorited ? 'Saved to Favorites' : 'Save Route to Favorites'}
          className={`p-2.5 rounded-xl border transition-all duration-200 ${
            isFavorited
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 cursor-default'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Terminal Stations Preview */}
      {sortedStops.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-[180px]">
              {sortedStops[0].station_name}
            </span>
          </div>
          <span className="text-slate-500 px-2">➔</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-[180px]">
              {sortedStops[sortedStops.length - 1].station_name}
            </span>
          </div>
        </div>
      )}

      {/* Expand/Collapse Timeline Button */}
      <div className="mt-4 pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <span>{expanded ? 'Hide Stop Sequence' : 'View Stop Sequence'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 text-rose-400 bg-rose-950/50 border border-rose-800">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Ordered Stop Timeline */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in duration-200">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Ordered Route Timeline ({sortedStops.length} Stations)
          </h4>

          {sortedStops.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No stop sequence found for this route.</p>
          ) : (
            <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {sortedStops.map((stop, index) => {
                const isFirst = index === 0;
                const isLast = index === sortedStops.length - 1;

                return (
                  <div key={stop.seq_no} className="relative flex items-center gap-3">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                        isFirst
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : isLast
                          ? 'bg-sky-500 text-slate-950 border-sky-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {stop.seq_no}
                    </div>

                    <div className="flex-1 flex items-center justify-between text-sm py-0.5">
                      <span
                        className={`font-medium ${
                          isFirst || isLast ? 'text-slate-100 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        {stop.station_name}
                      </span>
                      {isFirst && (
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Origin
                        </span>
                      )}
                      {isLast && (
                        <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                          Terminal
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
