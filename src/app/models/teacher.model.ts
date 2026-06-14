export interface Review {
  studentName: string;
  rating: number;
  date: string;
  comment: string;
}

export interface TimeSlot {
  hour: string;
  available: boolean;
}

export interface DayAvailability {
  date: string;
  timeSlots: TimeSlot[];
}

export type ContactType = 'email' | 'phone';

export interface Contact {
  type: ContactType;
  value: string;
}

export interface Teacher {
  id: string;
  name: string;
  career: string;
  year: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  subjects: string[];
  avatar?: string;
  about: string;
  contact: Contact;
  availability: DayAvailability[];
  reviews: Review[];
}
