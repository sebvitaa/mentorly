export interface CreateBookingDto {
  teacherId: string;
  date: string;
  hour: string;
  studentName?: string;
  studentEmail?: string;
}

export interface BookingDto {
  id: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  teacher_id: string;
  teacher_name: string;
  date: string;
  hour: string;
  student_name: string;
  student_email: string | null;
  created_at: string;
}
