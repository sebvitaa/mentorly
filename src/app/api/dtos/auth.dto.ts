export type UserRole = 'student' | 'tutor' | 'admin';

export interface UserDto {
  email: string;
  first_name: string;
  last_name: string;
  campus_id: string;
  faculty_id: string;
  career_id: string;
  admission_year: string;
  roles: UserRole[];
  created_at: string;
  updated_at: string;
}

export interface RegisterRequestDto {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  campus_id: string;
  faculty_id: string;
  career_id: string;
  admission_year: string;
  wants_to_teach: boolean;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  access_token: string;
  user: UserDto;
}
