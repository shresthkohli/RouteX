'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Bus,
  MapPin,
  Calendar,
  Clock,
  Ticket,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import {
  AdminStats,
  AdminStop,
  AdminRoute,
  AdminBus,
  AdminSchedule,
  AdminTrip,
  UserProfile,
} from '@/lib/types';

export default function AdminDashboardPage() {
  const router = useRouter();

  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'trips' | 'routes' | 'stops' | 'buses' | 'schedules'>('trips');

  // Global Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [stops, setStops] = useState<AdminStop[]>([]);
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [buses, setBuses] = useState<AdminBus[]>([]);
  const [schedules, setSchedules] = useState<AdminSchedule[]>([]);
  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Feedback notifications
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search filters per tab
  const [tripsSearch, setTripsSearch] = useState('');
  const [routesSearch, setRoutesSearch] = useState('');
  const [stopsSearch, setStopsSearch] = useState('');
  const [busesSearch, setBusesSearch] = useState('');
  const [schedulesSearch, setSchedulesSearch] = useState('');

  // -------------------------------------------------------------
  // Form States for CRUD
  // -------------------------------------------------------------

  // 1. Trip Form
  const [editingTripId, setEditingTripId] = useState<number | null>(null);
  const [tripForm, setTripForm] = useState({
    route_id: 0,
    bus_id: '' as string | number, // '' for unassigned
    schedule_id: 0,
    departure_time: '08:00:00',
    arrival_time: '09:00:00',
    fare: '25.00',
    status: 'Scheduled' as 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled',
  });

  // 2. Route Form
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const [routeForm, setRouteForm] = useState({
    route_number: '',
    route_name: '',
    route_type: 'City Bus' as 'City Bus' | 'BRTS' | 'Electric',
    is_active: true,
    stops: [] as { stop_id: number; stop_name: string; stop_sequence: number }[],
  });
  const [selectedStopToAdd, setSelectedStopToAdd] = useState<number | ''>('');

  // 3. Stop Form
  const [editingStopId, setEditingStopId] = useState<number | null>(null);
  const [stopForm, setStopForm] = useState({
    stop_name: '',
    latitude: '',
    longitude: '',
    is_active: true,
  });

  // 4. Bus Form
  const [editingBusId, setEditingBusId] = useState<number | null>(null);
  const [busForm, setBusForm] = useState({
    bus_number: '',
    bus_type: 'Standard' as 'Standard' | 'Articulated' | 'Mini' | 'Electric',
    capacity: 45,
    status: 'Active' as 'Active' | 'Maintenance' | 'Retired',
  });

  // 5. Schedule Form
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    schedule_name: '',
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true,
  });

  // Action pending state
  const [actionLoading, setActionLoading] = useState(false);

  // -------------------------------------------------------------
  // Initialization & Auth Verification
  // -------------------------------------------------------------
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          if (data.user.user_role === 'admin') {
            fetchAllAdminData();
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Admin auth check error:', err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const showBanner = (type: 'success' | 'error', text: string) => {
    setBannerMessage({ type, text });
    setTimeout(() => {
      setBannerMessage((cur) => (cur?.text === text ? null : cur));
    }, 5000);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (res.ok) {
        const s = await res.json();
        setStats(s.stats);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    }
  };

  const fetchAllAdminData = async () => {
    setDataLoading(true);
    try {
      const [statsRes, tripsRes, routesRes, stopsRes, busesRes, schedulesRes] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }),
        fetch('/api/admin/trips', { cache: 'no-store' }),
        fetch('/api/admin/routes', { cache: 'no-store' }),
        fetch('/api/admin/stops', { cache: 'no-store' }),
        fetch('/api/admin/buses', { cache: 'no-store' }),
        fetch('/api/admin/schedules', { cache: 'no-store' }),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s.stats);
      }
      if (tripsRes.ok) {
        const t = await tripsRes.json();
        setTrips(t.trips || []);
      }
      if (routesRes.ok) {
        const r = await routesRes.json();
        setRoutes(r.routes || []);
        if (r.routes?.length > 0 && tripForm.route_id === 0) {
          setTripForm((prev) => ({ ...prev, route_id: r.routes[0].route_id }));
        }
      }
      if (stopsRes.ok) {
        const st = await stopsRes.json();
        setStops(st.stops || []);
      }
      if (busesRes.ok) {
        const b = await busesRes.json();
        setBuses(b.buses || []);
      }
      if (schedulesRes.ok) {
        const sc = await schedulesRes.json();
        setSchedules(sc.schedules || []);
        if (sc.schedules?.length > 0 && tripForm.schedule_id === 0) {
          setTripForm((prev) => ({ ...prev, schedule_id: sc.schedules[0].schedule_id }));
        }
      }
    } catch (err: any) {
      showBanner('error', err.message || 'Failed to refresh admin data');
    } finally {
      setDataLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TRIPS CRUD
  // -------------------------------------------------------------
  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tripForm.arrival_time <= tripForm.departure_time) {
      showBanner('error', 'Arrival time must be later than departure time.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        route_id: Number(tripForm.route_id),
        bus_id: tripForm.bus_id !== '' ? Number(tripForm.bus_id) : null,
        schedule_id: Number(tripForm.schedule_id),
        departure_time: tripForm.departure_time,
        arrival_time: tripForm.arrival_time,
        fare: Number(tripForm.fare),
        status: tripForm.status,
      };

      const res = await fetch('/api/admin/trips', {
        method: editingTripId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTripId ? { trip_id: editingTripId, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save trip');

      showBanner('success', editingTripId ? 'Trip updated successfully!' : 'Trip scheduled successfully!');
      setEditingTripId(null);
      setTripForm({
        route_id: routes[0]?.route_id || 0,
        bus_id: '',
        schedule_id: schedules[0]?.schedule_id || 0,
        departure_time: '08:00:00',
        arrival_time: '09:00:00',
        fare: '25.00',
        status: 'Scheduled',
      });
      fetchAllAdminData();
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditTrip = (trip: AdminTrip) => {
    setEditingTripId(trip.trip_id);
    setTripForm({
      route_id: trip.route_id,
      bus_id: trip.bus_id ?? '',
      schedule_id: trip.schedule_id,
      departure_time: trip.departure_time,
      arrival_time: trip.arrival_time,
      fare: trip.fare,
      status: trip.status,
    });
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleDeleteTrip = async (tripId: number) => {
    if (!confirm(`Are you sure you want to delete Trip #${tripId}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/trips?tripId=${tripId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete trip');
      showBanner('success', `Trip #${tripId} deleted successfully.`);
      if (editingTripId === tripId) {
        setEditingTripId(null);
      }
      fetchAllAdminData();
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // ROUTES & STOP SEQUENCE CRUD
  // -------------------------------------------------------------
  const handleAddStopToRoute = () => {
    if (selectedStopToAdd === '') return;
    const stopObj = stops.find((s) => s.stop_id === Number(selectedStopToAdd));
    if (!stopObj) return;

    if (routeForm.stops.some((s) => s.stop_id === stopObj.stop_id)) {
      showBanner('error', `${stopObj.stop_name} is already in this route.`);
      return;
    }

    const nextSeq = routeForm.stops.length + 1;
    setRouteForm((prev) => ({
      ...prev,
      stops: [...prev.stops, { stop_id: stopObj.stop_id, stop_name: stopObj.stop_name, stop_sequence: nextSeq }],
    }));
    setSelectedStopToAdd('');
  };

  const handleMoveRouteStop = (index: number, direction: 'up' | 'down') => {
    const list = [...routeForm.stops];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // Recalculate sequences
    const updated = list.map((item, idx) => ({ ...item, stop_sequence: idx + 1 }));
    setRouteForm((prev) => ({ ...prev, stops: updated }));
  };

  const handleRemoveRouteStop = (stopId: number) => {
    const remaining = routeForm.stops
      .filter((s) => s.stop_id !== stopId)
      .map((item, idx) => ({ ...item, stop_sequence: idx + 1 }));
    setRouteForm((prev) => ({ ...prev, stops: remaining }));
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeForm.route_number.trim() || !routeForm.route_name.trim()) {
      showBanner('error', 'Route number and name are required.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        route_number: routeForm.route_number.trim(),
        route_name: routeForm.route_name.trim(),
        route_type: routeForm.route_type,
        is_active: routeForm.is_active,
        stops: routeForm.stops.map((s, idx) => ({ stop_id: s.stop_id, stop_sequence: idx + 1 })),
      };

      const res = await fetch('/api/admin/routes', {
        method: editingRouteId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRouteId ? { route_id: editingRouteId, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save route');

      showBanner('success', editingRouteId ? 'Route updated successfully!' : 'Route created successfully!');
      setEditingRouteId(null);
      setRouteForm({
        route_number: '',
        route_name: '',
        route_type: 'City Bus',
        is_active: true,
        stops: [],
      });
      fetchAllAdminData();
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditRoute = (route: AdminRoute) => {
    setEditingRouteId(route.route_id);
    setRouteForm({
      route_number: route.route_number,
      route_name: route.route_name,
      route_type: route.route_type,
      is_active: route.is_active,
      stops: [...route.stops],
    });
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleDeleteRoute = async (routeId: number) => {
    if (!confirm(`Are you sure you want to delete Route #${routeId}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/routes?routeId=${routeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete route');
      showBanner('success', `Route #${routeId} deleted successfully.`);
      if (editingRouteId === routeId) {
        setEditingRouteId(null);
      }
      fetchAllAdminData();
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STOPS CRUD
  // -------------------------------------------------------------
  const handleSaveStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stopForm.stop_name.trim()) {
      showBanner('error', 'Stop name is required.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        stop_name: stopForm.stop_name.trim(),
        latitude: stopForm.latitude ? Number(stopForm.latitude) : null,
        longitude: stopForm.longitude ? Number(stopForm.longitude) : null,
        is_active: stopForm.is_active,
      };

      const res = await fetch('/api/admin/stops', {
        method: editingStopId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStopId ? { stop_id: editingStopId, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save stop');

      showBanner('success', editingStopId ? 'Stop updated successfully!' : 'Stop created successfully!');
      setEditingStopId(null);
      setStopForm({ stop_name: '', latitude: '', longitude: '', is_active: true });
      fetchAllAdminData();
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStop = (stop: AdminStop) => {
    setEditingStopId(stop.stop_id);
    setStopForm({
      stop_name: stop.stop_name,
      latitude: stop.latitude ?? '',
      longitude: stop.longitude ?? '',
      is_active: stop.is_active,
    });
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleDeleteStop = async (stopId: number) => {
    if (!confirm(`Are you sure you want to delete Stop #${stopId}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/stops?stopId=${stopId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete stop');
      showBanner('success', `Stop #${stopId} deleted successfully.`);
      if (editingStopId === stopId) {
        setEditingStopId(null);
      }
      fetchAllAdminData();
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // BUSES FLEET CRUD
  // -------------------------------------------------------------
  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busForm.bus_number.trim()) {
      showBanner('error', 'Bus number is required.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        bus_number: busForm.bus_number.trim(),
        bus_type: busForm.bus_type,
        capacity: Number(busForm.capacity),
        status: busForm.status,
      };

      const res = await fetch('/api/admin/buses', {
        method: editingBusId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBusId ? { bus_id: editingBusId, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save bus');

      showBanner('success', editingBusId ? 'Bus updated successfully!' : 'Bus added to fleet!');
      setEditingBusId(null);
      setBusForm({ bus_number: '', bus_type: 'Standard', capacity: 45, status: 'Active' });
      fetchAllAdminData();
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditBus = (bus: AdminBus) => {
    setEditingBusId(bus.bus_id);
    setBusForm({
      bus_number: bus.bus_number,
      bus_type: bus.bus_type,
      capacity: bus.capacity,
      status: bus.status,
    });
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleDeleteBus = async (busId: number) => {
    if (!confirm(`Are you sure you want to delete Bus #${busId}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/buses?busId=${busId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete bus');
      showBanner('success', `Bus #${busId} deleted successfully.`);
      if (editingBusId === busId) {
        setEditingBusId(null);
      }
      fetchAllAdminData();
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // SCHEDULES CRUD
  // -------------------------------------------------------------
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.schedule_name.trim()) {
      showBanner('error', 'Schedule name is required.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        schedule_name: scheduleForm.schedule_name.trim(),
        monday: scheduleForm.monday,
        tuesday: scheduleForm.tuesday,
        wednesday: scheduleForm.wednesday,
        thursday: scheduleForm.thursday,
        friday: scheduleForm.friday,
        saturday: scheduleForm.saturday,
        sunday: scheduleForm.sunday,
      };

      const res = await fetch('/api/admin/schedules', {
        method: editingScheduleId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingScheduleId ? { schedule_id: editingScheduleId, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save schedule');

      showBanner('success', editingScheduleId ? 'Schedule updated successfully!' : 'Schedule created successfully!');
      setEditingScheduleId(null);
      setScheduleForm({
        schedule_name: '',
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
      });
      fetchAllAdminData();
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSchedule = (sch: AdminSchedule) => {
    setEditingScheduleId(sch.schedule_id);
    setScheduleForm({
      schedule_name: sch.schedule_name,
      monday: sch.monday,
      tuesday: sch.tuesday,
      wednesday: sch.wednesday,
      thursday: sch.thursday,
      friday: sch.friday,
      saturday: sch.saturday,
      sunday: sch.sunday,
    });
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm(`Are you sure you want to delete Schedule #${scheduleId}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/schedules?scheduleId=${scheduleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete schedule');
      showBanner('success', `Schedule #${scheduleId} deleted successfully.`);
      if (editingScheduleId === scheduleId) {
        setEditingScheduleId(null);
      }
      fetchAllAdminData();
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper badge styles
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

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Scheduled':
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
      case 'Maintenance':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Cancelled':
      case 'Retired':
      default:
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
  };

  // -------------------------------------------------------------
  // Unauthorized Screen
  // -------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <Loader2 className="w-10 h-10 text-emerald-400 mx-auto mb-4 animate-spin" />
        <p className="text-base font-medium text-slate-300">Checking administrator privileges...</p>
      </div>
    );
  }

  if (!user || user.user_role !== 'admin') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-md mx-auto rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Access Restricted</h2>
          <p className="text-sm text-slate-400 mt-2">
            The RouteX Admin Console requires administrative privileges. Your current account role is{' '}
            <span className="font-semibold text-slate-200 capitalize">
              {user?.user_role || 'passenger'}
            </span>.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
            >
              Back to Passenger Dashboard
            </Link>
            <Link
              href="/"
              className="rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Public Transit Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Filtered lists
  // -------------------------------------------------------------
  const filteredTrips = trips.filter(
    (t) =>
      t.route_number.toLowerCase().includes(tripsSearch.toLowerCase()) ||
      t.route_name.toLowerCase().includes(tripsSearch.toLowerCase()) ||
      (t.bus_number && t.bus_number.toLowerCase().includes(tripsSearch.toLowerCase())) ||
      t.schedule_name.toLowerCase().includes(tripsSearch.toLowerCase())
  );

  const filteredRoutes = routes.filter(
    (r) =>
      r.route_number.toLowerCase().includes(routesSearch.toLowerCase()) ||
      r.route_name.toLowerCase().includes(routesSearch.toLowerCase())
  );

  const filteredStops = stops.filter((s) =>
    s.stop_name.toLowerCase().includes(stopsSearch.toLowerCase())
  );

  const filteredBuses = buses.filter((b) =>
    b.bus_number.toLowerCase().includes(busesSearch.toLowerCase())
  );

  const filteredSchedules = schedules.filter((s) =>
    s.schedule_name.toLowerCase().includes(schedulesSearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Admin Console
            </span>
            <span className="text-xs text-slate-400">Surat Transit Master Controller</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Network Operations & Database Manager
          </h1>
        </div>

        <button
          onClick={fetchAllAdminData}
          disabled={dataLoading}
          className="self-start sm:self-auto rounded-xl px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Global Feedback Banner */}
      {bannerMessage && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-center justify-between border transition-all animate-in fade-in duration-200 ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800'
              : 'bg-rose-950/50 text-rose-300 border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP KPI SUMMARY STRIP (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Trips */}
        <div className="rounded-2xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>Total Trips</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 flex items-center min-h-[32px]">
            {stats === null ? (
              <span className="text-slate-500 font-normal">...</span>
            ) : (
              stats.total_trips ?? trips.length
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {stats === null ? (
              <span className="text-slate-500">Loading...</span>
            ) : (
              `${stats.scheduled_trips ?? trips.filter((t) => t.status === 'Scheduled').length} scheduled`
            )}
          </div>
        </div>

        {/* Active Routes */}
        <div className="rounded-2xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>Active Routes</span>
            <Bus className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 flex items-center min-h-[32px]">
            {stats === null ? (
              <span className="text-slate-500 font-normal">...</span>
            ) : (
              stats.active_routes ?? routes.filter((r) => r.is_active).length
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {stats === null ? (
              <span className="text-slate-500">Loading...</span>
            ) : (
              `of ${stats.total_routes ?? routes.length} total routes`
            )}
          </div>
        </div>

        {/* Bus Stops */}
        <div className="rounded-2xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>Bus Stops</span>
            <MapPin className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 flex items-center min-h-[32px]">
            {stats === null ? (
              <span className="text-slate-500 font-normal">...</span>
            ) : (
              stats.active_stops ?? stops.filter((s) => s.is_active).length
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {stats === null ? (
              <span className="text-slate-500">Loading...</span>
            ) : (
              `of ${stats.total_stops ?? stops.length} total stops`
            )}
          </div>
        </div>

        {/* Fleet Buses */}
        <div className="rounded-2xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>Fleet Buses</span>
            <Bus className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 flex items-center min-h-[32px]">
            {stats === null ? (
              <span className="text-slate-500 font-normal">...</span>
            ) : (
              stats.active_buses ?? buses.filter((b) => b.status === 'Active').length
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {stats === null ? (
              <span className="text-slate-500">Loading...</span>
            ) : (
              `of ${stats.total_buses ?? buses.length} total vehicles`
            )}
          </div>
        </div>

        {/* Schedules */}
        <div className="rounded-2xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>Schedules</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 flex items-center min-h-[32px]">
            {stats === null ? (
              <span className="text-slate-500 font-normal">...</span>
            ) : (
              stats.total_schedules ?? schedules.length
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">Weekly profiles</div>
        </div>
      </div>

      {/* TAB NAVIGATION PILLS */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-1.5 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('trips')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'trips'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          Trips Manager ({trips.length})
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'routes'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <Bus className="w-4 h-4" />
          Routes & Stops Builder ({routes.length})
        </button>

        <button
          onClick={() => setActiveTab('stops')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'stops'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Stops Directory ({stops.length})
        </button>

        <button
          onClick={() => setActiveTab('buses')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'buses'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <Bus className="w-4 h-4" />
          Bus Fleet ({buses.length})
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'schedules'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Schedules ({schedules.length})
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: TRIPS MANAGER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'trips' && (
        <div className="space-y-6">
          {/* Add / Edit Form */}
          <div className="rounded-2xl p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                {editingTripId ? `Edit Trip #${editingTripId}` : 'Schedule New Trip'}
              </h3>
              {editingTripId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTripId(null);
                    setTripForm({
                      route_id: routes[0]?.route_id || 0,
                      bus_id: '',
                      schedule_id: schedules[0]?.schedule_id || 0,
                      departure_time: '08:00:00',
                      arrival_time: '09:00:00',
                      fare: '25.00',
                      status: 'Scheduled',
                    });
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveTrip} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Assigned Route
                  </label>
                  <select
                    required
                    value={tripForm.route_id}
                    onChange={(e) => setTripForm({ ...tripForm, route_id: Number(e.target.value) })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {routes.map((r) => (
                      <option key={r.route_id} value={r.route_id}>
                        {r.route_number} — {r.route_name} ({r.route_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Assigned Bus
                  </label>
                  <select
                    value={tripForm.bus_id}
                    onChange={(e) => setTripForm({ ...tripForm, bus_id: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">(Unassigned Bus)</option>
                    {buses.map((b) => (
                      <option key={b.bus_id} value={b.bus_id}>
                        {b.bus_number} ({b.bus_type}, {b.capacity} seats, {b.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Schedule Calendar
                  </label>
                  <select
                    required
                    value={tripForm.schedule_id}
                    onChange={(e) => setTripForm({ ...tripForm, schedule_id: Number(e.target.value) })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {schedules.map((s) => (
                      <option key={s.schedule_id} value={s.schedule_id}>
                        {s.schedule_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Departure Time (HH:MM:SS)
                  </label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={tripForm.departure_time}
                    onChange={(e) => setTripForm({ ...tripForm, departure_time: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Arrival Time (HH:MM:SS)
                  </label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={tripForm.arrival_time}
                    onChange={(e) => setTripForm({ ...tripForm, arrival_time: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Ticket Fare (₹)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={tripForm.fare}
                    onChange={(e) => setTripForm({ ...tripForm, fare: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Trip Status
                  </label>
                  <select
                    value={tripForm.status}
                    onChange={(e) =>
                      setTripForm({
                        ...tripForm,
                        status: e.target.value as 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled',
                      })
                    }
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {editingTripId ? 'Update Trip' : 'Save Trip'}
                </button>
              </div>
            </form>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search trips by route, bus, or schedule..."
                value={tripsSearch}
                onChange={(e) => setTripsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-400">{filteredTrips.length} trips</span>
          </div>

          {/* Trips Table/List */}
          <div className="space-y-3">
            {filteredTrips.map((trip) => (
              <div
                key={trip.trip_id}
                className="rounded-2xl p-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono font-bold text-sm text-emerald-400">
                    {trip.route_number}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">{trip.route_name}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-0.5">
                      <span className="text-slate-300">
                        {trip.departure_time} ➔ {trip.arrival_time}
                      </span>
                      <span>•</span>
                      <span>{trip.schedule_name}</span>
                      <span>•</span>
                      <span>Bus: {trip.bus_number || '(Unassigned)'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-400">₹{trip.fare}</span>
                    <span
                      className={`ml-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getStatusBadgeStyle(
                        trip.status
                      )}`}
                    >
                      {trip.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditTrip(trip)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title="Edit Trip"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrip(trip.trip_id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-900 transition-colors"
                      title="Delete Trip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredTrips.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500 rounded-2xl bg-slate-900/40 border border-slate-800">
                No trips matching search criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: ROUTES & STOP SEQUENCE BUILDER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          {/* Add / Edit Form */}
          <div className="rounded-2xl p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Bus className="w-4 h-4 text-emerald-400" />
                {editingRouteId ? `Edit Route #${editingRouteId}` : 'Create New Route'}
              </h3>
              {editingRouteId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRouteId(null);
                    setRouteForm({
                      route_number: '',
                      route_name: '',
                      route_type: 'City Bus',
                      is_active: true,
                      stops: [],
                    });
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Route Number (e.g. 101, 11D)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 204"
                    value={routeForm.route_number}
                    onChange={(e) => setRouteForm({ ...routeForm, route_number: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Route Name (Origin - Destination)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Railway Station - Dumas"
                    value={routeForm.route_name}
                    onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Route Network Type
                  </label>
                  <select
                    value={routeForm.route_type}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, route_type: e.target.value as 'City Bus' | 'BRTS' | 'Electric' })
                    }
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="City Bus">City Bus</option>
                    <option value="BRTS">BRTS</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
              </div>

              {/* Ordered Stop Sequence Builder */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Route Stop Sequence ({routeForm.stops.length} stations)
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedStopToAdd}
                      onChange={(e) => setSelectedStopToAdd(e.target.value ? Number(e.target.value) : '')}
                      className="rounded-xl px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Stop to Append...</option>
                      {stops.map((s) => (
                        <option key={s.stop_id} value={s.stop_id}>
                          {s.stop_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddStopToRoute}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    >
                      Add Stop
                    </button>
                  </div>
                </div>

                {routeForm.stops.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No stops added yet. Select a stop above to build the transit timeline.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
                    {routeForm.stops.map((item, idx) => (
                      <div key={item.stop_id} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-slate-200 font-medium">{item.stop_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveRouteStop(idx, 'up')}
                            className="p-1 rounded text-slate-400 hover:text-slate-100 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === routeForm.stops.length - 1}
                            onClick={() => handleMoveRouteStop(idx, 'down')}
                            className="p-1 rounded text-slate-400 hover:text-slate-100 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveRouteStop(item.stop_id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400"
                            title="Remove Stop"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={routeForm.is_active}
                    onChange={(e) => setRouteForm({ ...routeForm, is_active: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                  />
                  <span>Active in Transit Network</span>
                </label>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {editingRouteId ? 'Update Route' : 'Save Route'}
                </button>
              </div>
            </form>
          </div>

          {/* Search Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search routes by number or name..."
                value={routesSearch}
                onChange={(e) => setRoutesSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-400">{filteredRoutes.length} routes</span>
          </div>

          {/* Routes List */}
          <div className="space-y-3">
            {filteredRoutes.map((route) => (
              <div
                key={route.route_id}
                className="rounded-2xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono font-bold text-base text-emerald-400">
                      {route.route_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getRouteBadgeStyle(
                            route.route_type
                          )}`}
                        >
                          {route.route_type}
                        </span>
                        <span className="text-xs text-slate-400">{route.stops.length} stops</span>
                        {!route.is_active && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            Inactive
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-100">{route.route_name}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditRoute(route)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title="Edit Route"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(route.route_id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-900 transition-colors"
                      title="Delete Route"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stop sequence preview */}
                {route.stops.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/70 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    {route.stops.map((s, idx) => (
                      <React.Fragment key={s.stop_id}>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                          {idx + 1}. {s.stop_name}
                        </span>
                        {idx < route.stops.length - 1 && <span className="text-slate-600">➔</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredRoutes.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500 rounded-2xl bg-slate-900/40 border border-slate-800">
                No routes matching search criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: STOPS MANAGER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'stops' && (
        <div className="space-y-6">
          {/* Add / Edit Form */}
          <div className="rounded-2xl p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {editingStopId ? `Edit Stop #${editingStopId}` : 'Add Bus Stop / Station'}
              </h3>
              {editingStopId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingStopId(null);
                    setStopForm({ stop_name: '', latitude: '', longitude: '', is_active: true });
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveStop} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Stop / Station Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Athwa Gate"
                    value={stopForm.stop_name}
                    onChange={(e) => setStopForm({ ...stopForm, stop_name: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Latitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="21.170240"
                    value={stopForm.latitude}
                    onChange={(e) => setStopForm({ ...stopForm, latitude: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Longitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="72.831062"
                    value={stopForm.longitude}
                    onChange={(e) => setStopForm({ ...stopForm, longitude: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stopForm.is_active}
                    onChange={(e) => setStopForm({ ...stopForm, is_active: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                  />
                  <span>Active Station</span>
                </label>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {editingStopId ? 'Update Stop' : 'Save Stop'}
                </button>
              </div>
            </form>
          </div>

          {/* Search Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search bus stops by name..."
                value={stopsSearch}
                onChange={(e) => setStopsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-400">{filteredStops.length} stops</span>
          </div>

          {/* Stops Grid/Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredStops.map((stop) => (
              <div
                key={stop.stop_id}
                className="rounded-2xl p-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs text-emerald-400">#{stop.stop_id}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        stop.is_active
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {stop.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100 mt-1">{stop.stop_name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {stop.latitude && stop.longitude
                      ? `${Number(stop.latitude).toFixed(4)}, ${Number(stop.longitude).toFixed(4)}`
                      : 'Coordinates unmapped'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-800/70">
                  <button
                    onClick={() => handleEditStop(stop)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit Stop"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteStop(stop.stop_id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete Stop"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {filteredStops.length === 0 && (
              <div className="col-span-full p-8 text-center text-sm text-slate-500 rounded-2xl bg-slate-900/40 border border-slate-800">
                No stops matching search criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: BUSES FLEET MANAGER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'buses' && (
        <div className="space-y-6">
          {/* Add / Edit Form */}
          <div className="rounded-2xl p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Bus className="w-4 h-4 text-emerald-400" />
                {editingBusId ? `Edit Bus #${editingBusId}` : 'Add Bus to Transit Fleet'}
              </h3>
              {editingBusId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingBusId(null);
                    setBusForm({ bus_number: '', bus_type: 'Standard', capacity: 45, status: 'Active' });
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveBus} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Bus Number (Registration)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="GJ-05-BX-1001"
                    value={busForm.bus_number}
                    onChange={(e) => setBusForm({ ...busForm, bus_number: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Vehicle Type
                  </label>
                  <select
                    value={busForm.bus_type}
                    onChange={(e) =>
                      setBusForm({
                        ...busForm,
                        bus_type: e.target.value as 'Standard' | 'Articulated' | 'Mini' | 'Electric',
                      })
                    }
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Articulated">Articulated</option>
                    <option value="Mini">Mini</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={busForm.capacity}
                    onChange={(e) => setBusForm({ ...busForm, capacity: Number(e.target.value) })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Operational Status
                  </label>
                  <select
                    value={busForm.status}
                    onChange={(e) =>
                      setBusForm({ ...busForm, status: e.target.value as 'Active' | 'Maintenance' | 'Retired' })
                    }
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {editingBusId ? 'Update Bus' : 'Save Bus'}
                </button>
              </div>
            </form>
          </div>

          {/* Search Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search buses by vehicle number..."
                value={busesSearch}
                onChange={(e) => setBusesSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-400">{filteredBuses.length} buses</span>
          </div>

          {/* Buses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredBuses.map((bus) => (
              <div
                key={bus.bus_id}
                className="rounded-2xl p-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-slate-100 tracking-wider">
                      {bus.bus_number}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getStatusBadgeStyle(
                        bus.status
                      )}`}
                    >
                      {bus.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                      {bus.bus_type}
                    </span>
                    <span className="text-xs text-slate-400">{bus.capacity} seats</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-800/70">
                  <button
                    onClick={() => handleEditBus(bus)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit Bus"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBus(bus.bus_id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete Bus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {filteredBuses.length === 0 && (
              <div className="col-span-full p-8 text-center text-sm text-slate-500 rounded-2xl bg-slate-900/40 border border-slate-800">
                No buses matching search criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: SCHEDULES MANAGER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          {/* Add / Edit Form */}
          <div className="rounded-2xl p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                {editingScheduleId ? `Edit Schedule #${editingScheduleId}` : 'Create Schedule Profile'}
              </h3>
              {editingScheduleId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingScheduleId(null);
                    setScheduleForm({
                      schedule_name: '',
                      monday: true,
                      tuesday: true,
                      wednesday: true,
                      thursday: true,
                      friday: true,
                      saturday: true,
                      sunday: true,
                    });
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Schedule Name (e.g. Daily All Week, Weekdays Only, Weekend Special)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Schedule"
                  value={scheduleForm.schedule_name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_name: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Operating Days of the Week
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'monday', label: 'Mon' },
                    { key: 'tuesday', label: 'Tue' },
                    { key: 'wednesday', label: 'Wed' },
                    { key: 'thursday', label: 'Thu' },
                    { key: 'friday', label: 'Fri' },
                    { key: 'saturday', label: 'Sat' },
                    { key: 'sunday', label: 'Sun' },
                  ].map((day) => {
                    const isChecked = (scheduleForm as any)[day.key];
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() =>
                          setScheduleForm({
                            ...scheduleForm,
                            [day.key]: !isChecked,
                          })
                        }
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                          isChecked
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {editingScheduleId ? 'Update Schedule' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>

          {/* Search Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search schedules by name..."
                value={schedulesSearch}
                onChange={(e) => setSchedulesSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-400">{filteredSchedules.length} schedules</span>
          </div>

          {/* Schedules List */}
          <div className="space-y-3">
            {filteredSchedules.map((sch) => (
              <div
                key={sch.schedule_id}
                className="rounded-2xl p-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{sch.schedule_name}</h4>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { key: 'monday', label: 'M' },
                      { key: 'tuesday', label: 'T' },
                      { key: 'wednesday', label: 'W' },
                      { key: 'thursday', label: 'T' },
                      { key: 'friday', label: 'F' },
                      { key: 'saturday', label: 'S' },
                      { key: 'sunday', label: 'S' },
                    ].map((d) => {
                      const active = (sch as any)[d.key];
                      return (
                        <span
                          key={d.key}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center border ${
                            active
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-slate-950 text-slate-600 border-slate-800'
                          }`}
                        >
                          {d.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => handleEditSchedule(sch)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    title="Edit Schedule"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(sch.schedule_id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-900 transition-colors"
                    title="Delete Schedule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {filteredSchedules.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500 rounded-2xl bg-slate-900/40 border border-slate-800">
                No schedules matching search criteria.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

