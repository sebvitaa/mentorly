import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Teacher } from '../../models/teacher.model';
import { TeacherCardComponent } from '../teacher-card/teacher-card.component';

@Component({
  selector: 'app-teacher-grid',
  standalone: true,
  imports: [TeacherCardComponent],
  templateUrl: './teacher-grid.component.html',
  styleUrl: './teacher-grid.component.scss',
})
export class TeacherGridComponent {
  @Input() teachers: Teacher[] = [];
  @Input() isLoading = false;
  @Output() teacherSelect = new EventEmitter<Teacher>();

  /** Fixed-length array used to render skeleton placeholders. */
  readonly skeletons = Array.from({ length: 6 });
}
