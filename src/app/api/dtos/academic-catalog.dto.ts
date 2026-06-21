export interface CampusDto {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface FacultyDto {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface CareerDto {
  id: string;
  faculty_id: string;
  campus_id: string;
  name: string;
  slug: string;
  active: boolean;
}
