import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../api-config';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/admin`;

  getOrganizations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/organizations`);
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  updateOrganizationStatus(id: string, subscriptionStatus: string, trialEndsAt?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/organizations/${id}/status`, { subscriptionStatus, trialEndsAt });
  }

  toggleUserStatus(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/toggle-status`, {});
  }

  createSuperAdmin(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/super-admins`, data);
  }
}
