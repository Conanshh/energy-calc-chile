import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TarifaService } from '../../services/tarifa.service';
import { RespuestaCalculo } from '../../models/tarifa.model';
import { COMUNAS_CHILE } from '../../models/comunas.data';
import { LucideAngularModule, Info } from 'lucide-angular';

@Component({
  selector: 'app-calculadora-tarifas',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './calculadora-tarifas.html',
  styleUrl: './calculadora-tarifas.css'
})
export class CalculadoraTarifasComponent {
  private tarifaService = inject(TarifaService);
  
  // Datos estáticos
  listaComunas = COMUNAS_CHILE;
  readonly InfoIcon = Info; // Declara el icono para usarlo en el HTML
  
  // Signals de estado del formulario
  comuna = signal('');
  watts = signal<number | null>(null);
  horas = signal<number | null>(null);
  dias = signal<number | null>(31); // Cambiado a null inicial para validación limpia

  // Signals de estado de interfaz
  mostrarSugerencias = signal(false);
  cargando = signal(false);
  error = signal<string | null>(null);
  resultado = signal<RespuestaCalculo | null>(null);
  
  // Filtra las comunas que EMPIEZAN con el texto ingresado
  comunasFiltradas() {
    const busqueda = this.comuna().toLowerCase().trim();
    if (!busqueda) return [];
    
    return this.listaComunas
      .filter(c => c.toLowerCase().startsWith(busqueda))
      .slice(0, 10);
  }

  seleccionarComuna(nombre: string) {
    this.comuna.set(nombre);
    this.mostrarSugerencias.set(false);
    this.error.set(null); // Limpiar error si selecciona una comuna válida
  }

  calcular() {   
    // 1. Resetear estados previos
    this.error.set(null);
    this.resultado.set(null);

    // 2. Extraer valores actuales para validación
    const comunaValor = this.comuna().trim();
    const wattsValor = this.watts();
    const horasValor = this.horas();
    const diasValor = this.dias();

    // 3. Validaciones de Negocio (Front-end)
    if (!comunaValor) {
      this.error.set('Debe ingresar una comuna.');
      return;
    }

    if (wattsValor === null || wattsValor <= 0) {
      this.error.set('La potencia debe ser un número mayor a 0.');
      return;
    }

    if (horasValor === null || horasValor <= 0 || horasValor > 24) {
      this.error.set('Las horas de uso deben estar entre 1 y 24.');
      return;
    }

    if (diasValor === null || diasValor <= 0 || diasValor > 31) {
      this.error.set('Los días del mes deben estar entre 1 y 31.');
      return;
    }

    // 4. Si pasa las validaciones, llamar al servicio
    this.cargando.set(true);

    this.tarifaService.getCalculo(
      comunaValor, 
      wattsValor, 
      horasValor, 
      diasValor
    ).subscribe({
      next: (res) => {
        // Asumiendo que la estructura de la respuesta es { data: RespuestaCalculo }
        this.resultado.set(res.data);
        this.cargando.set(false);
      },
      error: (err) => {
        // Captura el error enviado por el backend (ej: 400 Bad Request)
        const mensajeError = err.error?.message || err.error?.error || 'Error al conectar con el servidor';
        this.error.set(mensajeError);
        this.cargando.set(false);
      }
    });
  }
}