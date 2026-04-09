import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../services/translate.pipe';
import { LanguageService } from '../../services/language.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-platform-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './platform-admin.html',
  styleUrl: './platform-admin.css'
})
export class PlatformAdmin implements OnInit {
  private adminService = inject(AdminService);
  private langService = inject(LanguageService);
  
  organizations: any[] = [];
  users: any[] = [];
  loading = false;
  activeTab: 'orgs' | 'users' | 'admins' = 'orgs';
  
  searchTerm = '';
  statusOptions = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED'];

  // New SuperAdmin Form
  newAdmin = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };

  ngOnInit() {
    this.loadOrganizations();
  }

  setTab(tab: 'orgs' | 'users' | 'admins') {
    this.activeTab = tab;
    if (tab === 'orgs') this.loadOrganizations();
    if (tab === 'users') this.loadUsers();
  }

  loadOrganizations() {
    this.loading = true;
    this.adminService.getOrganizations().subscribe({
      next: (data) => {
        this.organizations = data;
        this.loading = false;
      },
      error: (err) => {
        Swal.fire(this.langService.translate('common.error'), this.langService.translate('platform_admin.messages.loadError'), 'error');
        this.loading = false;
      }
    });
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        Swal.fire(this.langService.translate('common.error'), this.langService.translate('platform_admin.messages.loadErrorUsers'), 'error');
        this.loading = false;
      }
    });
  }

  updateStatus(org: any) {
    Swal.fire({
      title: this.langService.translate('platform_admin.messages.updateConfirm'),
      text: this.langService.translate('platform_admin.messages.updateConfirmText', { status: org.subscriptionStatus }),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.langService.translate('common.confirm'),
      cancelButtonText: this.langService.translate('common.cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.updateOrganizationStatus(org.id, org.subscriptionStatus, org.trialEndsAt).subscribe({
          next: () => {
            Swal.fire(this.langService.translate('common.success'), this.langService.translate('platform_admin.messages.updateSuccess'), 'success');
          },
          error: (err) => Swal.fire(this.langService.translate('common.error'), err.error?.message || 'Error', 'error')
        });
      }
    });
  }

  toggleUser(user: any) {
    const action = user.isActive ? 'bloquear' : 'activar';
    Swal.fire({
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} usuario?`,
      text: `El usuario ${user.email} será ${user.isActive ? 'bloqueado' : 'activado'}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.toggleUserStatus(user.id).subscribe({
          next: (res) => {
            user.isActive = res.user.isActive;
            Swal.fire('Éxito', `Usuario ${user.isActive ? 'activado' : 'bloqueado'}`, 'success');
          },
          error: (err) => Swal.fire('Error', err.error?.message || 'Error al procesar', 'error')
        });
      }
    });
  }

  onCreateSuperAdmin() {
    if (!this.newAdmin.email || !this.newAdmin.firstName) return;

    Swal.fire({
      title: 'Procesando...',
      didOpen: () => Swal.showLoading()
    });

    this.adminService.createSuperAdmin(this.newAdmin).subscribe({
      next: () => {
        Swal.fire(this.langService.translate('common.success'), this.langService.translate('platform_admin.messages.createSuccess'), 'success');
        this.newAdmin = { firstName: '', lastName: '', email: '', password: '' };
        this.setTab('users');
      },
      error: (err) => Swal.fire(this.langService.translate('common.error'), err.error?.message || 'Error', 'error')
    });
  }

  filteredOrgs() {
    if (!this.searchTerm) return this.organizations;
    const term = this.searchTerm.toLowerCase();
    return this.organizations.filter(o => 
      o.name.toLowerCase().includes(term) || 
      o.id.toLowerCase().includes(term) ||
      o.owner?.email.toLowerCase().includes(term)
    );
  }

  filteredUsers() {
    if (!this.searchTerm) return this.users;
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(u => 
      u.email.toLowerCase().includes(term) || 
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.id.toLowerCase().includes(term)
    );
  }
}
