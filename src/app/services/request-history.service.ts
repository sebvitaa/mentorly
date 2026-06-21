import { Injectable, inject } from '@angular/core';

import { BookingStatus } from '../api/dtos/booking.dto';
import { LocalRequest } from '../models/local-request.model';
import { StorageService } from './storage.service';

const REQUESTS_STORAGE_KEY = 'mentorly:requests';

@Injectable({ providedIn: 'root' })
export class RequestHistoryService {
  private readonly storage = inject(StorageService);

  getRequests(): LocalRequest[] {
    return this.storage.get<LocalRequest[]>(REQUESTS_STORAGE_KEY, []);
  }

  saveRequest(request: LocalRequest): void {
    const requests = this.getRequests().filter((item) => item.id !== request.id);
    this.storage.set(REQUESTS_STORAGE_KEY, [request, ...requests]);
  }

  updateStatus(id: string, status: BookingStatus): void {
    const requests = this.getRequests().map((request) =>
      request.id === id ? { ...request, status } : request
    );
    this.storage.set(REQUESTS_STORAGE_KEY, requests);
  }
}
