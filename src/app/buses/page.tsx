'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bus, Filter, AlertCircle, Loader2 } from 'lucide-react';
import RouteCard from '@/components/RouteCard';
import { BusRouteOverview } from '@/lib/types';

export default function BusesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [routes, setRoutes] = useState<BusRouteOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = async (query = '', type = 'All') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query.trim());
      if (type && type !== 'All') params.append('routeType', type);

      const res = await fetch(`/api/buses?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load routes');
      }

      setRoutes(data.routes || []);
    } catch (err: any) {
      setError(err.message || 'Error loading bus routes');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRoutes(searchTerm, selectedType);
  }, [selectedType]);

  // Debounced search for query term
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRoutes(searchTerm, selectedType);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const routeTypes = ['All', 'City Bus', 'BRTS', 'Electric'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
          Surat Bus & Route <span className="text-emerald-400">Directory</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          Browse active transit corridors, examine complete station sequences, and save your frequent routes.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="rounded-2xl p-6 shadow-sm bg-slate-900/80 backdrop-blur-md border border-slate-800 mb-8 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-emerald-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by route number (e.g. 11, 102, 204) or route name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200"
          />
        </div>

        {/* Route Type Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Network:
            </span>
            {routeTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-200 ${
                  selectedType === type
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing {routes.length} routes
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-2.5 text-rose-400 bg-rose-950/50 border border-rose-800">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Routes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl p-12 text-center bg-slate-900/40 border border-slate-800/60">
            <Loader2 className="w-8 h-8 text-emerald-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-slate-300 font-medium">Loading route sequences...</p>
            <p className="text-xs text-slate-500 mt-1">
              Calling PostgreSQL cursor procedures to assemble station sequences
            </p>
          </div>
        ) : routes.length > 0 ? (
          routes.map((route) => (
            <RouteCard key={route.route_id} route={route} />
          ))
        ) : (
          <div className="rounded-2xl p-12 text-center bg-slate-900/60 border border-slate-800">
            <Bus className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">
              No Transit Routes Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1.5">
              No active routes match the search criteria &ldquo;{searchTerm}&rdquo; under the {selectedType} category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
