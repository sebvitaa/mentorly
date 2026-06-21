import { Teacher } from '../../models/teacher.model';
import { TeacherDto } from '../dtos/teacher.dto';

export function mapTeacherDtoToTeacher(dto: TeacherDto): Teacher {
  return {
    id: dto.id,
    name: dto.name,
    career: dto.career,
    year: dto.year,
    rating: dto.rating,
    reviewCount: dto.review_count,
    priceRange: dto.price_range,
    subjects: dto.subjects,
    avatar: dto.avatar_url ?? undefined,
    about: dto.about,
    contact: dto.contact,
    availability: dto.availability.map((day) => ({
      date: day.date,
      timeSlots: day.time_slots,
    })),
    reviews: dto.reviews.map((review) => ({
      studentName: review.student_name,
      rating: review.rating,
      date: review.date,
      comment: review.comment,
    })),
  };
}
