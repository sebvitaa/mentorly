import { BookingStatus } from '../api/dtos/booking.dto';

export interface LocalRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  hour: string;
  status: BookingStatus;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  career: string;
  currentYear: string;
  message: string | null;
  createdAt: string;
}
