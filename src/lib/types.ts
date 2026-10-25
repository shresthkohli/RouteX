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
