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
  IncomingRequestView,
} from '../../services/booking.service';
import { TeacherContact, TeacherService } from '../../services/teacher.service';
import { TutorProfileService } from '../../services/tutor-profile.service';
import { FavoriteTeacher } from '../../models/favorite-teacher.model';
import { FavoritesService } from '../../services/favorites.service';
import { formatFullDate, formatShortDate, formatDateTime } from '../../utils/format.util';

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
  private readonly teacherService = inject(TeacherService);
  private readonly tutorProfileService = inject(TutorProfileService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly toastController = inject(ToastController);

  readonly formatFullDate = formatFullDate;
  readonly formatShortDate = formatShortDate;
  readonly formatDateTime = formatDateTime;

  // --- Lado estudiante ---
  requests: BookingRequestView[] = [];
  /** Contacto del tutor por `teacherId`, para reservas confirmadas. */
  contacts: Record<string, TeacherContact | null> = {};
  favorites: FavoriteTeacher[] = [];
  cancellingId: string | null = null;

  // --- Lado tutor ("Solicitudes para ti") ---
  isTutor = false;
  incoming: IncomingRequestView[] = [];
  processingId: string | null = null;

  ngOnInit(): void {
    this.loadRequests();
    this.favorites = this.favoritesService.getFavorites();
    this.loadIncoming();
  }

  // --- Estudiante -----------------------------------------------------------

  /** Solo se muestran pendientes y confirmadas (las rechazadas se ocultan). */
  get visibleRequests(): BookingRequestView[] {
    return this.requests.filter(
      (r) => r.status === 'pending' || r.status === 'confirmed'
    );
  }

  cancelRequest(request: BookingRequestView): void {
    if (
      (request.status !== 'pending' && request.status !== 'confirmed') ||
      this.cancellingId
    ) {
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

  // --- Tutor ----------------------------------------------------------------

  get pendingIncoming(): IncomingRequestView[] {
    return this.incoming.filter((r) => r.status === 'pending');
  }

  get acceptedIncoming(): IncomingRequestView[] {
    return this.incoming.filter((r) => r.status === 'confirmed');
  }

  acceptRequest(request: IncomingRequestView): void {
    if (request.status !== 'pending' || this.processingId) {
      return;
    }
    this.processingId = request.id;
    this.bookingService.acceptBooking(request.id).subscribe({
      next: async () => {
        this.processingId = null;
        this.loadIncoming();
        await this.presentToast('Solicitud aceptada.', 'primary');
      },
      error: async () => {
        this.processingId = null;
        await this.presentToast(
          'No se pudo aceptar la solicitud. Intenta nuevamente.',
          'warning'
        );
      },
    });
  }

  rejectRequest(request: IncomingRequestView): void {
    if (request.status !== 'pending' || this.processingId) {
      return;
    }
    this.processingId = request.id;
    this.bookingService.rejectBooking(request.id).subscribe({
      next: async () => {
        this.processingId = null;
        this.loadIncoming();
        await this.presentToast('Solicitud rechazada.', 'primary');
      },
      error: async () => {
        this.processingId = null;
        await this.presentToast(
          'No se pudo rechazar la solicitud. Intenta nuevamente.',
          'warning'
        );
      },
    });
  }

  cancelAccepted(request: IncomingRequestView): void {
    if (request.status !== 'confirmed' || this.processingId) {
      return;
    }
    this.processingId = request.id;
    this.bookingService.cancelBooking(request.id).subscribe({
      next: async () => {
        this.processingId = null;
        this.loadIncoming();
        await this.presentToast('Tutoría cancelada.', 'primary');
      },
      error: async () => {
        this.processingId = null;
        await this.presentToast(
          'No se pudo cancelar la tutoría. Intenta nuevamente.',
          'warning'
        );
      },
    });
  }

  // --- Estado ---------------------------------------------------------------

  statusLabel(status: BookingStatus): string {
    const labels: Record<BookingStatus, string> = {
      pending: 'Pendiente',
      confirmed: 'Aceptada',
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
        this.loadContactsForConfirmed();
      },
      error: () => {
        this.requests = [];
      },
    });
  }

  /** Revela el contacto del tutor para las reservas confirmadas (fase-6 RPC). */
  private loadContactsForConfirmed(): void {
    const confirmed = this.requests.filter((r) => r.status === 'confirmed');
    for (const request of confirmed) {
      if (request.teacherId in this.contacts) {
        continue;
      }
      this.teacherService.getTeacherContact(request.teacherId).subscribe({
        next: (contact) => (this.contacts[request.teacherId] = contact),
        error: () => (this.contacts[request.teacherId] = null),
      });
    }
  }

  private loadIncoming(): void {
    this.tutorProfileService.getMyTutorProfile().subscribe({
      next: (profile) => {
        this.isTutor = profile !== null;
        if (this.isTutor) {
          this.bookingService.getIncomingRequests().subscribe({
            next: (incoming) => (this.incoming = incoming),
            error: () => (this.incoming = []),
          });
        }
      },
      error: () => {
        this.isTutor = false;
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
