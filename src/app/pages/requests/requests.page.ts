import { Component, OnInit, inject } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  ToastController,
} from '@ionic/angular/standalone';

import { BookingApiService } from '../../api/booking-api.service';
import { HeaderComponent } from '../../components/header/header.component';
import { BookingStatus } from '../../api/dtos/booking.dto';
import { FavoriteTeacher } from '../../models/favorite-teacher.model';
import { LocalRequest } from '../../models/local-request.model';
import { FavoritesService } from '../../services/favorites.service';
import { RequestHistoryService } from '../../services/request-history.service';
import { formatFullDate } from '../../utils/format.util';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [
    HeaderComponent,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonChip,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonText,
  ],
  templateUrl: './requests.page.html',
  styleUrl: './requests.page.scss',
})
export class RequestsPage implements OnInit {
  private readonly bookingApi = inject(BookingApiService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly requestHistory = inject(RequestHistoryService);
  private readonly toastController = inject(ToastController);

  readonly formatFullDate = formatFullDate;

  requests: LocalRequest[] = [];
  favorites: FavoriteTeacher[] = [];
  cancellingId: string | null = null;

  ngOnInit(): void {
    this.loadLocalData();
  }

  async cancelRequest(request: LocalRequest): Promise<void> {
    if (request.status !== 'pending' || this.cancellingId) {
      return;
    }

    this.cancellingId = request.id;
    this.bookingApi.cancelBooking(request.id, 'Cancelada por el estudiante').subscribe({
      next: async () => {
        this.markRequestCancelled(request.id);
        await this.presentToast('Solicitud cancelada.', 'primary');
      },
      error: async () => {
        this.markRequestCancelled(request.id);
        await this.presentToast(
          'La API no tenia esta solicitud activa, pero se cancelo localmente.',
          'warning'
        );
      },
    });
  }

  removeFavorite(teacherId: string): void {
    this.favoritesService.removeFavorite(teacherId);
    this.loadLocalData();
  }

  statusLabel(status: BookingStatus): string {
    const labels: Record<BookingStatus, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      rejected: 'Rechazada',
      cancelled: 'Cancelada',
      completed: 'Completada',
    };
    return labels[status];
  }

  statusColor(status: BookingStatus): string {
    const colors: Record<BookingStatus, string> = {
      pending: 'warning',
      confirmed: 'success',
      rejected: 'danger',
      cancelled: 'medium',
      completed: 'primary',
    };
    return colors[status];
  }

  private markRequestCancelled(id: string): void {
    this.requestHistory.updateStatus(id, 'cancelled');
    this.cancellingId = null;
    this.loadLocalData();
  }

  private loadLocalData(): void {
    this.requests = this.requestHistory.getRequests();
    this.favorites = this.favoritesService.getFavorites();
  }

  private async presentToast(
    message: string,
    color: 'primary' | 'warning'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
