import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
 
  constructor(public updates: SwUpdate) {

    if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers no están disponibles en este navegador');
    return;
  }
    if (updates.isEnabled) {
      interval(6 * 60 * 60).subscribe(() => updates.checkForUpdate()
        .then(() => {}));
    }
  }

  public checkForUpdates(): void {

     try {
    // Tu lógica de actualización aquí
    this.updates.checkForUpdate().then(valor => {
      if(valor){
        this.promptUser()
      }
    })
  } catch (error) {
    console.error('Error al verificar actualizaciones:', error);
  }
    // this.updates.checkForUpdate().then(valor => {
    //   if(valor){
    //     this.promptUser()
    //   }
    // })
  }

  private promptUser(): void {
    this.updates.activateUpdate().then(() => document.location.reload()); 
  }

}
