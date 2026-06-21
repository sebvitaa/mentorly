import { Injectable, inject } from '@angular/core';

import { FavoriteTeacher } from '../models/favorite-teacher.model';
import { Teacher } from '../models/teacher.model';
import { StorageService } from './storage.service';

const FAVORITES_STORAGE_KEY = 'mentorly:favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly storage = inject(StorageService);

  getFavorites(): FavoriteTeacher[] {
    return this.storage.get<FavoriteTeacher[]>(FAVORITES_STORAGE_KEY, []);
  }

  isFavorite(teacherId: string): boolean {
    return this.getFavorites().some((teacher) => teacher.id === teacherId);
  }

  toggleFavorite(teacher: Teacher): boolean {
    if (this.isFavorite(teacher.id)) {
      this.removeFavorite(teacher.id);
      return false;
    }

    const favorite: FavoriteTeacher = {
      id: teacher.id,
      name: teacher.name,
      career: teacher.career,
      priceRange: teacher.priceRange,
      subjects: teacher.subjects,
      rating: teacher.rating,
      reviewCount: teacher.reviewCount,
    };

    this.storage.set(FAVORITES_STORAGE_KEY, [favorite, ...this.getFavorites()]);
    return true;
  }

  removeFavorite(teacherId: string): void {
    const favorites = this.getFavorites().filter(
      (teacher) => teacher.id !== teacherId
    );
    this.storage.set(FAVORITES_STORAGE_KEY, favorites);
  }
}
