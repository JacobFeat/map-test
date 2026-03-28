import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { GeocodingService } from './geocoding.service';

describe('GeocodingService', () => {
  let service: GeocodingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GeocodingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should map Nominatim response to street and house number', () => {
    let result: unknown;
    service.reverseGeocode(52.23, 21.01).subscribe((r) => {
      result = r;
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === 'https://nominatim.openstreetmap.org/reverse' &&
        r.params.get('lat') === '52.23' &&
        r.params.get('lon') === '21.01'
    );
    req.flush({
      address: {
        road: 'Marszałkowska',
        house_number: '10',
        city: 'Warszawa',
      },
      display_name: '10, Marszałkowska, Warszawa, Polska',
    });

    expect(result).toEqual({
      street: 'Marszałkowska',
      houseNumber: '10',
      label: 'Marszałkowska 10',
      formatted: '10, Marszałkowska, Warszawa, Polska',
    });
  });
});
