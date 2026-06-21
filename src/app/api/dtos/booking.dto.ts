export interface CreateBookingDto {
  teacher_id: string;
  subject_id?: string | null;
  date: string;
  hour: string;
  student_first_name: string;
  student_last_name: string;
  student_admission_year: string;
  student_email: string;
  student_campus_id: string;
  student_faculty_id: string;
  student_career_id: string;
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
  student_admission_year: string;
  student_email: string;
  student_campus_id: string;
  student_faculty_id: string;
  student_career_id: string;
  student_career: string;
  message: string | null;
  tutor_response_message: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
}
