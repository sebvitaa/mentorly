import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Teacher } from '../../models/teacher.model';
import { getInitials } from '../../utils/format.util';

@Component({
  selector: 'app-teacher-card',
  standalone: true,
  templateUrl: './teacher-card.component.html',
  styleUrl: './teacher-card.component.scss',
})
export class TeacherCardComponent {
  @Input({ required: true }) teacher!: Teacher;
  @Output() select = new EventEmitter<void>();

  readonly getInitials = getInitials;

  onActivate(): void {
    this.select.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onActivate();
    }
  }
}
