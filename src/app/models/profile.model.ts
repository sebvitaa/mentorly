export type TeacherStatus =
  | 'none'
  | 'incomplete'
  | 'pending'
  | 'active'
  | 'inactive'
  | 'rejected';

export interface ProfileView {
  id: string;
  fullName: string;
  email: string;
  campusId: string;
  campusName: string;
  facultyId: string;
  facultyName: string;
  careerId: string;
  careerName: string;
  admissionYear: string;
  teacherStatus: TeacherStatus;
}
