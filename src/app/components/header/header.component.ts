import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <h1 class="logo">Mentorly UDD</h1>
    </header>
  `,
  styleUrl: './header.component.scss',
})
export class HeaderComponent {}
