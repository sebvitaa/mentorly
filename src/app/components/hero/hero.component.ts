import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  @Input() activeFilter: string | null = null;
  @Output() search = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<string | null>();

  readonly quickFilters = ['Cálculo', 'Economía', 'Programación', 'Química'];
  searchQuery = '';

  onSubmit(event: Event): void {
    event.preventDefault();
    this.search.emit(this.searchQuery);
  }

  onFilterClick(filter: string): void {
    this.filterChange.emit(this.activeFilter === filter ? null : filter);
  }
}
