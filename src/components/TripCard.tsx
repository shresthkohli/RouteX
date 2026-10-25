'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bus, Clock, Bookmark, CheckCircle2, Ticket, Users, AlertCircle, ArrowRight } from 'lucide-react';
import { BusServiceResult } from '@/lib/types';

interface TripCardProps {
  trip: BusServiceResult;
  onBookSuccess?: (bookingId: number) => void;
  onFavoriteSuccess?: () => void;
}

export default function TripCard({
  trip,
  onBookSuccess,
  onFavoriteSuccess,
}: TripCardProps) {
  const router = useRouter();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<number | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Format 24-hr time string (HH:MM:SS) to standard readable time
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const handleBookTicket = async () => {
    setBookingLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_id: trip.trip_id }),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to book ticket');
      }

      const bookingId = data.booking?.booking_id;
      setBookingSuccess(bookingId || 1);
      if (onBookSuccess && bookingId) {
        onBookSuccess(bookingId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error booking ticket');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSaveFavorite = async () => {
    setFavoriteLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route_id: trip.route_id }),
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
      setErrorMessage(err.message || 'Error saving route');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const getRouteBadgeStyle = (busType?: string | null) => {
    const type = busType?.toLowerCase() || '';
    if (type.includes('electric')) {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (type.includes('brts') || type.includes('articulated')) {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
  };

  return (
    <div className="rounded-2xl p-6 shadow-sm bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:bg-slate-800/70 hover:border-slate-700 transition-all duration-200">
      {/* Top Header: Route Number, Name, Route Type, and Bookmark */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 font-mono font-bold text-base text-emerald-400 tracking-wider">
            {trip.route_number}
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base leading-snug">
              {trip.route_name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>{trip.schedule_name}</span>
              <span>•</span>
              <span className="capitalize">{trip.trip_status}</span>
            </p>
          </div>
        </div>

        {/* Favorite Bookmark Button */}
        <button
          onClick={handleSaveFavorite}
          disabled={favoriteLoading || isFavorited}
          title={isFavorited ? 'Route Saved' : 'Save Route to Favorites'}
          className={`p-2.5 rounded-xl border transition-all duration-200 ${
            isFavorited
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 cursor-default'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Main Schedule Info: Departure -> Arrival & Fare */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-3 border-y border-slate-800/70 my-2">
        {/* Timeline stations */}
        <div className="md:col-span-8 flex items-center justify-between sm:justify-start gap-4 sm:gap-8">
          {/* Departure */}
          <div>
            <div className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              {formatTime(trip.departure_time)}
            </div>
            <div className="text-xs font-medium text-slate-300 max-w-[150px] sm:max-w-[180px] truncate">
              {trip.departure_stop}
            </div>
            <div className="text-[11px] text-slate-500">Stop #{trip.departure_sequence}</div>
          </div>

          {/* Indicator */}
          <div className="flex flex-col items-center px-2">
            <span className="text-[11px] text-slate-400 font-medium">Direct</span>
            <div className="w-16 sm:w-24 h-0.5 bg-gradient-to-r from-emerald-500 to-sky-500 my-1 relative">
              <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-sky-400" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 -mt-0.5" />
          </div>

          {/* Arrival */}
          <div>
            <div className="text-lg font-bold text-slate-100">
              {formatTime(trip.arrival_time)}
            </div>
            <div className="text-xs font-medium text-slate-300 max-w-[150px] sm:max-w-[180px] truncate">
              {trip.arrival_stop}
            </div>
            <div className="text-[11px] text-slate-500">Stop #{trip.arrival_sequence}</div>
          </div>
        </div>

        {/* Fare Price Card */}
        <div className="md:col-span-4 flex md:flex-col items-center md:items-end justify-between md:justify-center">
          <span className="text-xs text-slate-400">Total Fare</span>
          <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
            ₹{trip.fare}
          </div>
        </div>
      </div>

      {/* Footer Info: Bus specs, Badges, and Booking Button */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {trip.bus_type && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium border ${getRouteBadgeStyle(
                trip.bus_type
              )}`}
            >
              {trip.bus_type}
            </span>
          )}
          {trip.bus_number && (
            <span className="rounded-full px-3 py-1 text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
              <Bus className="w-3 h-3 text-slate-400" />
              Bus: {trip.bus_number}
            </span>
          )}
          {trip.capacity && (
            <span className="rounded-full px-3 py-1 text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-slate-400" />
              {trip.capacity} seats
            </span>
          )}
        </div>

        {/* Action Button */}
        <div>
          {bookingSuccess ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Ticket Confirmed (#{bookingSuccess})
            </div>
          ) : (
            <button
              onClick={handleBookTicket}
              disabled={bookingLoading}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all duration-200 shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              <Ticket className="w-4 h-4" />
              {bookingLoading ? 'Reserving...' : 'Book Ticket'}
            </button>
          )}
        </div>
      </div>

      {/* Error banner if any */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl text-xs flex items-center gap-2 text-rose-400 bg-rose-950/50 border border-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
