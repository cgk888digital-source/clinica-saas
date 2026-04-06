import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VideoConsultationService } from '../../../services/video-consultation.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-call-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './call-notification.html',
  styleUrl: './call-notification.css'
})
export class CallNotification {
  private videoService = inject(VideoConsultationService);
  public langService = inject(LanguageService);
  private router = inject(Router);
  
  private audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');

  incomingCall = this.videoService.incomingCall;
  
  constructor() {
    this.audio.loop = true;
    
    // Escuchar cambios en la señal de llamada para reproducir/detener sonido
    // Nota: En Angular 17+ se usaría effect(), pero aquí lo haremos reactivamente
    // observando la señal en el ciclo de vida o mediante un watcher simple.
    setInterval(() => {
      if (this.incomingCall()) {
        if (this.audio.paused) {
          this.audio.play().catch(e => console.warn('Audio play blocked by browser:', e));
        }
      } else {
        if (!this.audio.paused) {
          this.audio.pause();
          this.audio.currentTime = 0;
        }
      }
    }, 500);
  }
  
  // Mensaje traducido dinámicamente
  callMessage = computed(() => {
    const call = this.incomingCall();
    if (!call) return '';
    const isEs = this.langService.lang() === 'es';
    return isEs 
      ? `Llamada entrante de ${call.fromName}` 
      : `Incoming call from ${call.fromName}`;
  });

  acceptCall() {
    const call = this.incomingCall();
    if (call) {
      this.videoService.incomingCall.set(null); // Limpiar notificación
      this.router.navigate(['/video-call', call.consultationId]);
    }
  }

  declineCall() {
    this.videoService.incomingCall.set(null);
  }
}
