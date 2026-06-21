export interface ReviewDto {
  student_name: string;
  rating: number;
  date: string;
  comment: string;
}

export interface TimeSlotDto {
  hour: string;
  available: boolean;
}

export interface DayAvailabilityDto {
  date: string;
  time_slots: TimeSlotDto[];
}

export interface ContactDto {
  type: 'email' | 'phone';
  value: string;
}

export interface TeacherDto {
  id: string;
  name: string;
  career: string;
  year: string;
  rating: number;
  review_count: number;
  price_range: string;
  subjects: string[];
  avatar_url?: string | null;
  about: string;
  contact: ContactDto;
  availability: DayAvailabilityDto[];
  reviews: ReviewDto[];
}
