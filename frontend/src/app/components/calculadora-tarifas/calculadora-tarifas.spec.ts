import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculadoraTarifasComponent } from './calculadora-tarifas';

describe('CalculadoraTarifas', () => {
  let component: CalculadoraTarifasComponent;
  let fixture: ComponentFixture<CalculadoraTarifasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculadoraTarifasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalculadoraTarifasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
