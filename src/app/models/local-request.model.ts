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
  admissionYear: string;
  campusId: string;
  campusName: string;
  facultyId: string;
  facultyName: string;
  careerId: string;
  careerName: string;
  message: string | null;
  createdAt: string;
}
