import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import type {
  Circle,
  LatLng,
  LeafletMouseEvent,
  Map as LeafletMap,
  Marker,
} from 'leaflet';
import { GeocodingService, type SelectedLocation } from './geocoding.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'sandbox';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly geocoding = inject(GeocodingService);

  private readonly mapHost = viewChild.required<ElementRef<HTMLElement>>('mapHost');

  readonly location = signal<SelectedLocation | null>(null);
  readonly loadingAddress = signal(false);
  readonly addressError = signal<string | null>(null);

  private map: LeafletMap | null = null;
  private marker: Marker | null = null;
  /** Okrąg ~1 km (promień w metrach w układzie EPSG:3857 / przybliżenie na mapie). */
  private radiusCircle: Circle | null = null;

  private static readonly RADIUS_METERS = 500;

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      void this.initMap();
    });
  }

  private async initMap(): Promise<void> {
    const el = this.mapHost().nativeElement;
    const leaflet = await import('leaflet');
    const L = leaflet.default;

    // Icon.Default składa `imagePath` + `iconUrl` — pełna ścieżka tylko w `iconUrl`
    // daje zły URL; ustawiamy folder i same nazwy plików (jak w Leaflet).
    L.Icon.Default.mergeOptions({
      imagePath: 'assets/leaflet/',
      iconUrl: 'marker-icon.png',
      iconRetinaUrl: 'marker-icon-2x.png',
      shadowUrl: 'marker-shadow.png',
    });

    // Środek Krakowa (ok. Stare Miasto)
    const start: [number, number] = [50.0647, 19.945];
    const map = L.map(el).setView(start, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    this.map = map;

    map.on('click', (e: LeafletMouseEvent) => {
      this.placePinAndResolveAddress(L, map, e.latlng);
    });

    setTimeout(() => map.invalidateSize(), 0);
  }

  private placePinAndResolveAddress(
    L: typeof import('leaflet'),
    map: LeafletMap,
    latlng: LatLng
  ): void {
    if (!this.marker) {
      this.marker = L.marker(latlng).addTo(map);
    } else {
      this.marker.setLatLng(latlng);
    }

    if (!this.radiusCircle) {
      this.radiusCircle = L.circle(latlng, {
        radius: AppComponent.RADIUS_METERS,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
    } else {
      this.radiusCircle.setLatLng(latlng);
    }

    this.loadingAddress.set(true);
    this.addressError.set(null);

    this.geocoding.reverseGeocode(latlng.lat, latlng.lng).subscribe({
      next: (loc) => {
        this.loadingAddress.set(false);
        this.location.set(loc);
      },
      error: () => {
        this.loadingAddress.set(false);
        this.addressError.set('Nie udało się pobrać adresu. Spróbuj ponownie.');
      },
    });
  }
}
