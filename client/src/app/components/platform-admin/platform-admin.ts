import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-platform-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './platform-admin.html',
  styleUrl: './platform-admin.css'
})
export class PlatformAdmin implements OnInit {
  private adminService = inject(AdminService);
  
  organizations: any[] = [];
  loading = false;
  
  statusOptions = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED'];

  ngOnInit() {
    this.loadOrganizations();
  }

  loadOrganizations() {
    this.loading = true;
    this.adminService.getOrganizations().subscribe({
      next: (data) => {
        this.organizations = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orgs', err);
        this.loading = false;
      }
    });
  }

  updateStatus(org: any) {
    this.adminService.updateOrganizationStatus(org.id, org.subscriptionStatus, org.trialEndsAt).subscribe({
      next: () => {
        alert('Estado actualizado correctamente');
      },
      error: (err) => alert('Error al actualizar: ' + err.message)
    });
  }

  toggleUser(user: any) {
    this.adminService.toggleUserStatus(user.id).subscribe({
      next: (res) => {
        user.isActive = res.user.isActive;
        alert(`Usuario ${user.isActive ? 'Activado' : 'Bloqueado'}`);
      },
      error: (err) => alert('Error: ' + err.message)
    });
  }
}
