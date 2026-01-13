import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TarifaService {
  // En Angular moderno usamos inject() en lugar del constructor
  private http = inject(HttpClient);
  
  // La URL de tu backend
  private apiUrl = `${environment.apiUrl}/tarifas/calcular`;
  /**
   * Método para llamar a nuestra API de Node.js
   */
  getCalculo(comuna: string, watts: number, horas: number, dias: number): Observable<any> {
    // Definimos los parámetros que espera nuestro Backend
    const params = { 
      comuna, 
      watts: watts.toString(), 
      horas: horas.toString(), 
      dias: dias.toString() 
    };

    return this.http.get<any>(this.apiUrl, { params });
  }
}