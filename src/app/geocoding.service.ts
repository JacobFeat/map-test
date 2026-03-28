import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';

/** Odpowiedź Nominatim (fragment potrzebny do adresu). */
interface NominatimReverseResponse {
  address?: {
    road?: string;
    pedestrian?: string;
    path?: string;
    house_number?: string;
    house_name?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
    country?: string;
  };
  display_name?: string;
}

export interface SelectedLocation {
  /** Ulica (bez numeru). */
  street: string;
  /** Numer budynku / lokalu, jeśli jest w danych OSM. */
  houseNumber: string | null;
  /** Krótka etykieta: ulica + numer. */
  label: string;
  /** Pełniejszy opis (np. z miejscowością). */
  formatted: string;
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);

  /**
   * Odwrotne geokodowanie przez proxy `/api/geocode/reverse` (dev + SSR),
   * zgodnie z polityką użycia Nominatim.
   */
  reverseGeocode(lat: number, lon: number): Observable<SelectedLocation> {
    const params = new HttpParams()
      .set('lat', String(lat))
      .set('lon', String(lon))
      .set('format', 'json')
      .set('addressdetails', '1');

    return this.http
      .get<NominatimReverseResponse>('/api/geocode/reverse', { params })
      .pipe(map((res) => this.toLocation(res)));
  }

  private toLocation(res: NominatimReverseResponse): SelectedLocation {
    const a = res.address ?? {};
    const street =
      a.road ?? a.pedestrian ?? a.path ?? '';
    const houseNumber =
      a.house_number ?? a.house_name ?? null;
    const place =
      a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? '';

    const streetPart = street.trim();
    const label =
      houseNumber && streetPart
        ? `${streetPart} ${houseNumber}`
        : streetPart || houseNumber || res.display_name?.split(',')[0]?.trim() || '—';

    const formatted =
      res.display_name ??
      [label, place, a.postcode, a.country].filter(Boolean).join(', ');

    return {
      street: streetPart || '—',
      houseNumber,
      label,
      formatted,
    };
  }
}
