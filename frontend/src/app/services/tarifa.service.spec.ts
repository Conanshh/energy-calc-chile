import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TarifaService } from './tarifa.service';
import { firstValueFrom } from 'rxjs'; // Importante para manejar el observable

describe('TarifaService', () => {
  let service: TarifaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TarifaService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TarifaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe llamar al API con los parámetros correctos y retornar datos', async () => {
    const mockResponse = {
      meta: { comuna: 'ALGARROBO' },
      dispositivo: { consumo_total_mes_kwh: 90 },
      grupos: []
    };

    // 1. Iniciamos la llamada (es una promesa ahora)
    const pedidoApi = firstValueFrom(service.getCalculo('Algarrobo', 1500, 2, 30));

    // 2. Interceptamos y respondemos (esto ocurre "mientras" se espera la promesa)
    const req = httpMock.expectOne(request => 
      request.url.includes('/api/tarifas/calcular') &&
      request.params.get('comuna') === 'Algarrobo'
    );
    req.flush(mockResponse);

    // 3. Esperamos el resultado final
    const res = await pedidoApi;

    // 4. Verificaciones
    expect(res.meta.comuna).toBe('ALGARROBO');
    expect(res.dispositivo.consumo_total_mes_kwh).toBe(90);
  });

  it('debe manejar correctamente una respuesta sin grupos de tarifas', async () => {
    const emptyResponse = {
      meta: { comuna: 'COMUNA VACIA' },
      dispositivo: { consumo_total_mes_kwh: 0 },
      grupos: [] // El backend no encontró tarifas
    };

    const pedidoApi = firstValueFrom(service.getCalculo('Vacia', 100, 1, 1));
    
    const req = httpMock.expectOne(request => request.url.includes('/calcular'));
    req.flush(emptyResponse);

    const res = await pedidoApi;
    expect(res.grupos.length).toBe(0); // Verificamos que no explota
  });

  it('debe propagar el error cuando el servidor responde con 500', async () => {
    const errorMessage = 'Error interno del servidor';

    const pedidoApi = firstValueFrom(service.getCalculo('Error', 100, 1, 1));

    const req = httpMock.expectOne(request => request.url.includes('/calcular'));
    
    // Simulamos un error real de red/servidor
    req.flush(errorMessage, { status: 500, statusText: 'Server Error' });

    await expect(pedidoApi).rejects.toThrow();
  });
});