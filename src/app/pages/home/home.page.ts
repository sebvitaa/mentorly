import { Component, OnInit, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

import { Teacher } from '../../models/teacher.model';
import { TeacherService } from '../../services/teacher.service';
import { HeaderComponent } from '../../components/header/header.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { TeacherGridComponent } from '../../components/teacher-grid/teacher-grid.component';
import { TeacherModalComponent } from '../../components/teacher-modal/teacher-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    IonContent,
    HeaderComponent,
    HeroComponent,
    TeacherGridComponent,
    TeacherModalComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  private readonly teacherService = inject(TeacherService);

  teachers: Teacher[] = [];
  searchQuery = '';
  activeFilter: string | null = null;
  isLoading = false;

  selectedTeacher: Teacher | null = null;
  isModalOpen = false;

  ngOnInit(): void {
    this.refresh();
  }

  /**
   * Cada vez que se entra a Home se recarga el catálogo desde Supabase, así un
   * tutor recién publicado aparece sin tener que recargar toda la app.
   */
  ionViewWillEnter(): void {
    this.teacherService.reload();
    this.refresh();
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.refresh();
  }

  onFilterChange(filter: string | null): void {
    this.activeFilter = filter;
    this.refresh();
  }

  openTeacher(teacher: Teacher): void {
    this.selectedTeacher = teacher;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedTeacher = null;
  }

  /** Re-query the service, simulating a short load so skeletons are visible. */
  private refresh(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.teacherService
        .searchTeachers({ query: this.searchQuery, subject: this.activeFilter })
        .subscribe((teachers) => {
          this.teachers = teachers;
          this.isLoading = false;
        });
    }, 300);
  }
}
