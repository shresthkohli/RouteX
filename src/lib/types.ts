export interface StopOption {
  stop_id: number;
  stop_name: string;
}

export interface BusServiceResult {
  trip_id: number;
  route_id: number;
  route_number: string;
  route_name: string;
  departure_stop: string;
  arrival_stop: string;
  departure_sequence: number;
  arrival_sequence: number;
  departure_time: string;
  arrival_time: string;
  fare: string;
  bus_number: string | null;
  bus_type: string | null;
  capacity: number | null;
  trip_status: string;
  schedule_name: string;
}

export interface RouteStopItem {
  seq_no: number;
  station_name: string;
}

export interface BusRouteOverview {
  route_id: number;
  route_number: string;
  route_name: string;
  route_type: 'City Bus' | 'BRTS' | 'Electric';
  is_active: boolean;
  stops: RouteStopItem[];
}

export interface UserProfile {
  passenger_id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  user_role: 'passenger' | 'admin';
  created_at: string;
}

export interface PassengerBooking {
  booking_id: number;
  booking_date: string;
  booking_status: string;
  booked_at: string;
  fare_paid: string;
  trip_id: number;
  departure_time: string;
  arrival_time: string;
  trip_status: string;
  route_id: number;
  route_number: string;
  route_name: string;
  route_type: string;
  bus_number: string | null;
  bus_type: string | null;
  schedule_name: string;
}

export interface FavoriteRoute {
  favorite_id: number;
  saved_at: string;
  route_id: number;
  route_number: string;
  route_name: string;
  route_type: string;
  is_active: boolean;
  start_stop_name: string;
  end_stop_name: string;
  total_stops: number;
}


export interface AdminStats {
  total_stops: number;
  active_stops: number;
  total_routes: number;
  active_routes: number;
  total_buses: number;
  active_buses: number;
  total_schedules: number;
  total_trips: number;
  scheduled_trips: number;
  total_users: number;
}

export interface AdminStop {
  stop_id: number;
  stop_name: string;
  latitude: string | null;
  longitude: string | null;
  is_active: boolean;
}

export interface AdminRouteStopInput {
  stop_id: number;
  stop_sequence: number;
}

export interface AdminRoute {
  route_id: number;
  route_number: string;
  route_name: string;
  route_type: 'City Bus' | 'BRTS' | 'Electric';
  is_active: boolean;
  stops: {
    stop_id: number;
    stop_name: string;
    stop_sequence: number;
  }[];
}

export interface AdminBus {
  bus_id: number;
  bus_number: string;
  bus_type: 'Standard' | 'Articulated' | 'Mini' | 'Electric';
  capacity: number;
  status: 'Active' | 'Maintenance' | 'Retired';
}

export interface AdminSchedule {
  schedule_id: number;
  schedule_name: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface AdminTrip {
  trip_id: number;
  route_id: number;
  route_number: string;
  route_name: string;
  bus_id: number | null;
  bus_number: string | null;
  schedule_id: number;
  schedule_name: string;
  departure_time: string;
  arrival_time: string;
  fare: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
}
