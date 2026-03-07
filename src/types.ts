export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birthdate: string;
  status: 'inactive' | 'active' | 'suspended';
}

export interface ChatMessage {
  id?: number;
  user_id: number;
  session_id?: number;
  message: string;
  role: 'user' | 'model';
  timestamp: string;
  risk_level?: 'none' | 'low' | 'medium' | 'high';
}

export interface Appointment {
  id: number;
  user_id: number;
  date: string;
  time: string;
  type: 'presencial' | 'llamada';
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
}
