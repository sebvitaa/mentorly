export interface CreateBookingDto {
  teacher_id: string;
  subject_id?: string | null;
  date: string;
  hour: string;
  student_first_name: string;
  student_last_name: string;
  student_career: string;
  student_current_year: string;
  student_email: string;
  message?: string | null;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface BookingDto {
  id: string;
  status: BookingStatus;
  student_id: string;
  teacher_id: string;
  teacher_name: string;
  subject_id: string | null;
  date: string;
  hour: string;
  student_first_name: string;
  student_last_name: string;
  student_career: string;
  student_current_year: string;
  student_email: string;
  message: string | null;
  tutor_response_message: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
}
