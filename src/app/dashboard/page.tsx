'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Bookmark,
  Ticket,
  Clock,
  Bus,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { UserProfile, FavoriteRoute, PassengerBooking } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [bookings, setBookings] = useState<PassengerBooking[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Auth Profile
      const meRes = await fetch('/api/auth/me');
      if (meRes.status === 401) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      if (!meRes.ok) throw new Error(meData.error || 'Failed to fetch user profile');
      setProfile(meData.user);

      // 2. Fetch Bookings and Favorites in parallel
      const [bookingsRes, favoritesRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/favorites'),
      ]);

      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        setBookings(bData.bookings || []);
      }

      if (favoritesRes.ok) {
        const fData = await favoritesRes.json();
        setFavorites(fData.favorites || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRemoveFavorite = async (routeId: number) => {
    setDeletingRouteId(routeId);
    try {
      const res = await fetch(`/api/favorites?routeId=${routeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove route');
      }
      setFavorites((prev) => prev.filter((fav) => fav.route_id !== routeId));
    } catch (err: any) {
      alert(err.message || 'Error removing favorite route');
    } finally {
      setDeletingRouteId(null);
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Loader2 className="w-10 h-10 text-emerald-400 mx-auto mb-4 animate-spin" />
        <p className="text-base font-medium text-slate-300">Loading your transit portal...</p>
        <p className="text-xs text-slate-500 mt-1">Retrieving profile, bookings, and saved routes</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* SECTION 1: Profile Header Card */}
      {profile && (
        <div className="rounded-2xl p-6 sm:p-8 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-slate-950 font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-2xl font-bold text-slate-100">{profile.name}</h1>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 capitalize">
                  {profile.user_role}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                {profile.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    {profile.email}
                  </span>
                )}
                {profile.phone_number && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    {profile.phone_number}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Member since {formatDateTime(profile.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[90px]">
              <span className="block text-xl font-bold text-emerald-400">{bookings.length}</span>
              <span className="text-[11px] text-slate-400 font-medium">Bookings</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[90px]">
              <span className="block text-xl font-bold text-sky-400">{favorites.length}</span>
              <span className="text-[11px] text-slate-400 font-medium">Saved Routes</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Saved Routes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Saved Routes</h2>
            <span className="text-xs text-slate-400">({favorites.length})</span>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-2xl p-8 text-center bg-slate-900/40 border border-slate-800/80">
            <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-medium">No saved routes yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Bookmark routes on the search or bus directory page for quick reference.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map((fav) => (
              <div
                key={fav.favorite_id}
                className="rounded-2xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 font-mono font-bold text-sm text-emerald-400">
                        {fav.route_number}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getRouteBadgeStyle(
                          fav.route_type
                        )}`}
                      >
                        {fav.route_type}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveFavorite(fav.route_id)}
                      disabled={deletingRouteId === fav.route_id}
                      title="Remove from saved"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-slate-200 text-sm mb-3">
                    {fav.route_name}
                  </h3>

                  <div className="py-2.5 px-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                    <span className="truncate max-w-[130px]">{fav.start_stop_name}</span>
                    <span className="text-slate-500 px-1">➔</span>
                    <span className="truncate max-w-[130px]">{fav.end_stop_name}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>{fav.total_stops} total stops</span>
                  <span>Saved on {formatDateTime(fav.saved_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Past Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Booking History</h2>
            <span className="text-xs text-slate-400">({bookings.length})</span>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-2xl p-8 text-center bg-slate-900/40 border border-slate-800/80">
            <Ticket className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-medium">No bookings made yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Search for bus services on the home page and click &quot;Book Ticket&quot; to receive your transit receipt.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.booking_id}
                className="rounded-2xl p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono font-bold text-sm text-emerald-400">
                      {b.route_number}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 text-sm">
                        {b.route_name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>Ticket #{b.booking_id}</span>
                        <span>•</span>
                        <span>Booked on {formatDateTime(b.booked_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full px-3 py-1 text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {b.booking_status}
                    </span>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Fare Paid</span>
                      <span className="text-lg font-bold text-emerald-400">₹{b.fare_paid}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span>Departure: {formatTime(b.departure_time)}</span>
                    </div>
                    <span>➔</span>
                    <div>
                      <span>Arrival: {formatTime(b.arrival_time)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400">
                    {b.bus_number && (
                      <span className="flex items-center gap-1">
                        <Bus className="w-3.5 h-3.5 text-slate-500" />
                        Bus #{b.bus_number}
                      </span>
                    )}
                    {b.bus_type && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getRouteBadgeStyle(
                          b.bus_type
                        )}`}
                      >
                        {b.bus_type}
                      </span>
                    )}
                    {b.schedule_name && (
                      <span>Schedule: {b.schedule_name}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
