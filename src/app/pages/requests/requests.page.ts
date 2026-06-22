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

import { HeaderComponent } from '../../components/header/header.component';
import {
  BookingRequestView,
  BookingService,
  BookingStatus,
} from '../../services/booking.service';
import { FavoriteTeacher } from '../../models/favorite-teacher.model';
import { FavoritesService } from '../../services/favorites.service';
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
  private readonly bookingService = inject(BookingService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly toastController = inject(ToastController);

  readonly formatFullDate = formatFullDate;

  requests: BookingRequestView[] = [];
  favorites: FavoriteTeacher[] = [];
  cancellingId: string | null = null;

  ngOnInit(): void {
    this.loadRequests();
    this.favorites = this.favoritesService.getFavorites();
  }

  cancelRequest(request: BookingRequestView): void {
    if (request.status !== 'pending' || this.cancellingId) {
      return;
    }

    this.cancellingId = request.id;
    this.bookingService.cancelBooking(request.id).subscribe({
      next: async () => {
        this.cancellingId = null;
        this.loadRequests();
        await this.presentToast('Solicitud cancelada.', 'primary');
      },
      error: async () => {
        this.cancellingId = null;
        await this.presentToast(
          'No se pudo cancelar la solicitud. Intenta nuevamente.',
          'warning'
        );
      },
    });
  }

  removeFavorite(teacherId: string): void {
    this.favoritesService.removeFavorite(teacherId);
    this.favorites = this.favoritesService.getFavorites();
  }

  statusLabel(status: BookingStatus): string {
    const labels: Record<BookingStatus, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      rejected: 'Rechazada',
      cancelled: 'Cancelada',
    };
    return labels[status];
  }

  statusColor(status: BookingStatus): string {
    const colors: Record<BookingStatus, string> = {
      pending: 'warning',
      confirmed: 'success',
      rejected: 'danger',
      cancelled: 'medium',
    };
    return colors[status];
  }

  private loadRequests(): void {
    this.bookingService.getMyRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
      },
      error: () => {
        this.requests = [];
      },
    });
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
