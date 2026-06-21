import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonButton, IonButtons, IonHeader, IonTitle, IonToolbar, RouterLink],
  template: `
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-title class="logo">Mentorly UDD</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/home">Inicio</ion-button>
          <ion-button routerLink="/requests">Mis solicitudes</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styleUrl: './header.component.scss',
})
export class HeaderComponent {}
