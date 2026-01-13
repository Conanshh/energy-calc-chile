import { Component, signal } from '@angular/core';
import { CalculadoraTarifasComponent } from "./components/calculadora-tarifas/calculadora-tarifas";

@Component({
  selector: 'app-root',
  imports: [CalculadoraTarifasComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
