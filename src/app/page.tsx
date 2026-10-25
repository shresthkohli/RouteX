'use client';

import React, { useState } from 'react';
import { ArrowLeftRight, Search, Clock, Calendar, SlidersHorizontal, AlertCircle, Bus, Sparkles } from 'lucide-react';
import StopAutocomplete from '@/components/StopAutocomplete';
import TripCard from '@/components/TripCard';
import { StopOption, BusServiceResult } from '@/lib/types';

export default function HomePage() {
  const [fromStop, setFromStop] = useState<StopOption | null>(null);
  const [toStop, setToStop] = useState<StopOption | null>(null);

  // Time Mode: 'live' = Live IST now, 'custom' = Custom Time / Full Day Schedule
  const [timeMode, setTimeMode] = useState<'live' | 'custom'>('live');
  const [customTime, setCustomTime] = useState<string>('00:00:00');
  const [customDay, setCustomDay] = useState<number>(() => {
    // Current day of week in 1-7 ISO format (1=Mon..7=Sun)
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  });

  // Results & State
  const [trips, setTrips] = useState<BusServiceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side Filters & Sort
  const [selectedBusType, setSelectedBusType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'departure' | 'fare'>('departure');

  // Swap From & To stations
  const handleSwapStops = () => {
    const temp = fromStop;
    setFromStop(toStop);
    setToStop(temp);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!fromStop || !toStop) {
      setError('Please select both Origin and Destination stations.');
      return;
    }

    if (fromStop.stop_id === toStop.stop_id) {
      setError('Origin and Destination stations cannot be identical.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        fromStopId: String(fromStop.stop_id),
        toStopId: String(toStop.stop_id),
      });

      if (timeMode === 'custom') {
        params.append('departureAfter', customTime);
        params.append('dayOfWeek', String(customDay));
      }

      const res = await fetch(`/api/trips/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to search trips.');
      }

      setTrips(data.trips || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during search.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering and sorting
  const filteredTrips = trips
    .filter((trip) => {
      if (selectedBusType === 'All') return true;
      return (trip.bus_type || '').toLowerCase() === selectedBusType.toLowerCase();
    })
    .sort((a, b) => {
      if (sortBy === 'fare') {
        return parseFloat(a.fare || '0') - parseFloat(b.fare || '0');
      }
      return (a.departure_time || '').localeCompare(b.departure_time || '');
    });

  const busTypeOptions = ['All', 'Standard', 'Electric', 'Articulated'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Headline */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Surat Municipal Transit Direct Search</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Where would you like to travel in <span className="text-emerald-400">Surat</span>?
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl mx-auto">
          Real-time schedule lookup, direct route matching, and seamless ticketing across City Bus and BRTS corridors.
        </p>
      </div>

      {/* Hero Search Card */}
      <div className="rounded-2xl p-6 shadow-sm bg-slate-900/80 backdrop-blur-md border border-slate-800 mb-8">
        <form onSubmit={handleSearch}>
          {/* Station Selection Row */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <StopAutocomplete
              id="fromStop"
              label="From Station"
              placeholder="e.g. Surat Railway Station, Dumas..."
              value={fromStop}
              onChange={setFromStop}
            />

            {/* Swap Button */}
            <div className="md:mt-5">
              <button
                type="button"
                onClick={handleSwapStops}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-all duration-200"
                title="Swap stations"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <StopAutocomplete
              id="toStop"
              label="To Station"
              placeholder="e.g. Athwa Gate, Adajan..."
              value={toStop}
              onChange={setToStop}
            />
          </div>

          {/* Time Filter & Schedule Mode Toggle */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Mode:
              </span>
              <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTimeMode('live')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    timeMode === 'live'
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Departing Now (Live IST)
                </button>
                <button
                  type="button"
                  onClick={() => setTimeMode('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    timeMode === 'custom'
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Custom Time / Full Day Schedule
                </button>
              </div>
            </div>

            {/* Custom Time & Day Inputs (visible only if timeMode === 'custom') */}
            {timeMode === 'custom' && (
              <div className="flex items-center gap-3 animate-in fade-in duration-200">
                <div>
                  <input
                    type="time"
                    step="1"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="rounded-xl px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                    title="Departure Time (HH:MM:SS)"
                  />
                </div>
                <div>
                  <select
                    value={customDay}
                    onChange={(e) => setCustomDay(parseInt(e.target.value, 10))}
                    className="rounded-xl px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                    <option value={7}>Sunday</option>
                  </select>
                </div>
              </div>
            )}

            {/* Search Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Searching...' : 'Find Buses'}
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl text-xs flex items-center gap-2 text-rose-400 bg-rose-950/50 border border-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Filter and Sort Toolbar (visible if searched & has results) */}
      {hasSearched && trips.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Bus Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Type:
            </span>
            {busTypeOptions.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedBusType(type)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                  selectedBusType === type
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'departure' | 'fare')}
              className="rounded-xl px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="departure">Departure Time</option>
              <option value="fare">Lowest Fare</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Header */}
      {hasSearched && !loading && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">
            Available Services ({filteredTrips.length} found)
          </h2>
          {timeMode === 'live' && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live departures
            </span>
          )}
        </div>
      )}

      {/* Results List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl p-12 text-center bg-slate-900/40 border border-slate-800/60 animate-pulse">
            <Bus className="w-8 h-8 text-emerald-400 mx-auto mb-3 animate-bounce" />
            <p className="text-sm text-slate-300 font-medium">
              Scanning Surat transit schedules...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Querying direct connections and live bus capacities
            </p>
          </div>
        ) : filteredTrips.length > 0 ? (
          filteredTrips.map((trip) => (
            <TripCard key={trip.trip_id} trip={trip} />
          ))
        ) : hasSearched ? (
          <div className="rounded-2xl p-10 text-center bg-slate-900/60 border border-slate-800">
            <Bus className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">
              No Direct Bus Services Found
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5">
              No direct trips are scheduled between these stations at the requested time.
              Try switching to <span className="text-emerald-400 font-medium">&quot;Custom Time / Full Day Schedule&quot;</span> with time set to <span className="font-mono text-slate-300">00:00:00</span> to view all daily scheduled departures.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl p-10 text-center bg-slate-900/30 border border-slate-800/50">
            <Bus className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">
              Ready to Navigate Surat
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Choose your origin and destination above, then click &quot;Find Buses&quot; to inspect schedules, fares, and reserve tickets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
