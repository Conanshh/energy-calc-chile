import { Component, signal, OnInit } from '@angular/core';
import { CalculadoraTarifasComponent } from "./components/calculadora-tarifas/calculadora-tarifas";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CalculadoraTarifasComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  isDarkMode = signal(false);

  ngOnInit() {
    console.log('--- Inicializando Modo Oscuro ---');
    const savedTheme = localStorage.getItem('theme');
    console.log('Tema recuperado de localStorage:', savedTheme);

    if (savedTheme === 'dark') {
      this.aplicarTema(true);
    } else {
      console.log('Usando tema claro por defecto');
    }
  }

  toggleDarkMode() {
    const nuevoEstado = !this.isDarkMode();
    console.log('Cambiando tema. Nuevo estado dark:', nuevoEstado);
    this.aplicarTema(nuevoEstado);
  }

  private aplicarTema(esOscuro: boolean) {
    this.isDarkMode.set(esOscuro);
    const temaString = esOscuro ? 'dark' : 'light';
    
    // Esto es lo más importante: inyectar el atributo en el <html>
    document.documentElement.setAttribute('data-theme', temaString);
    localStorage.setItem('theme', temaString);
    
    console.log(`Atributo [data-theme="${temaString}"] aplicado al HTML`);
  }
}