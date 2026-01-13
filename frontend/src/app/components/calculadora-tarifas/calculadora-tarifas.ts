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
  
  listaComunas = COMUNAS_CHILE;
  readonly InfoIcon = Info; 
  
  comuna = signal('');
  watts = signal<number | null>(null);
  horas = signal<number | null>(null);
  dias = signal<number | null>(31); 

  mostrarSugerencias = signal(false);
  cargando = signal(false);
  error = signal<string | null>(null);
  resultado = signal<RespuestaCalculo | null>(null);

  // Lógica para mensajes de carga dinámicos
  private pasosCarga = [
    'Conectando con el servidor de tarifas...',
    'Extrayendo datos de la CNE...',
    'Actualizando precios por comuna...',
    'Calculando cargos y fórmulas...',
    'Casi listo, finalizando reporte...'
  ];
  mensajeCarga = signal(this.pasosCarga[0]);

  comunasFiltradas() {
    const busqueda = this.comuna().toLowerCase().trim();
    if (!busqueda) return [];
    return this.listaComunas.filter(c => c.toLowerCase().startsWith(busqueda)).slice(0, 10);
  }

  seleccionarComuna(nombre: string) {
    this.comuna.set(nombre);
    this.mostrarSugerencias.set(false);
    this.error.set(null);
  }

  calcular() {   
    this.error.set(null);
    this.resultado.set(null);

    const comunaValor = this.comuna().trim();
    const wattsValor = this.watts();
    const horasValor = this.horas();
    const diasValor = this.dias();

    if (!comunaValor || wattsValor === null || wattsValor <= 0 || 
        horasValor === null || horasValor <= 0 || horasValor > 24 || 
        diasValor === null || diasValor <= 0 || diasValor > 31) {
      this.error.set('Por favor, verifique que todos los campos sean correctos.');
      return;
    }

    // Iniciar carga y rotación de mensajes
    this.cargando.set(true);
    let pasoActual = 0;
    this.mensajeCarga.set(this.pasosCarga[0]);

    const intervalId = setInterval(() => {
      pasoActual++;
      if (pasoActual < this.pasosCarga.length) {
        this.mensajeCarga.set(this.pasosCarga[pasoActual]);
      }
    }, 1800);

    this.tarifaService.getCalculo(comunaValor, wattsValor, horasValor, diasValor).subscribe({
      next: (res) => {
        this.resultado.set(res.data);
        clearInterval(intervalId);
        this.cargando.set(false);
      },
      error: (err) => {
        const mensajeError = err.error?.message || 'Error al conectar con el servidor';
        this.error.set(mensajeError);
        clearInterval(intervalId);
        this.cargando.set(false);
      }
    });
  }
}