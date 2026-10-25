'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader2, Check } from 'lucide-react';
import { StopOption } from '@/lib/types';

interface StopAutocompleteProps {
  label: string;
  value: StopOption | null;
  onChange: (stop: StopOption | null) => void;
  placeholder?: string;
  id?: string;
}

export default function StopAutocomplete({
  label,
  value,
  onChange,
  placeholder = 'Search station or stop...',
  id,
}: StopAutocompleteProps) {
  const [query, setQuery] = useState(value ? value.stop_name : '');
  const [options, setOptions] = useState<StopOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal input value if external value changes
  useEffect(() => {
    setQuery(value ? value.stop_name : '');
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query text to selected value if user typed without selecting
        if (value) {
          setQuery(value.stop_name);
        } else {
          setQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const trimmed = query.trim();
        const res = await fetch(`/api/stops/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setOptions(data.stops || []);
        }
      } catch (err) {
        console.error('Stop search fetch error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleSelect = (stop: StopOption) => {
    onChange(stop);
    setQuery(stop.stop_name);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setIsOpen(true);
  };

  return (
    <div className="relative flex-1" ref={containerRef}>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
      >
        {label}
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <MapPin className="w-4 h-4 text-emerald-400" />
        </div>

        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (value && e.target.value !== value.stop_name) {
              onChange(null);
            }
          }}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200"
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {loading ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Search className="w-4 h-4 text-slate-500 pointer-events-none" />
          )}
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-40 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl py-1 divide-y divide-slate-800/60 animate-in fade-in zoom-in-95 duration-100">
          {loading && options.length === 0 ? (
            <div className="p-3.5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              Searching stops...
            </div>
          ) : options.length > 0 ? (
            options.map((stop) => {
              const isSelected = value?.stop_id === stop.stop_id;
              return (
                <button
                  key={stop.stop_id}
                  type="button"
                  onClick={() => handleSelect(stop)}
                  className={`w-full px-3.5 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-300 font-medium'
                      : 'text-slate-200 hover:bg-slate-800/80 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{stop.stop_name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })
          ) : (
            <div className="p-3.5 text-center text-xs text-slate-400">
              No matching stops found in Surat.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
