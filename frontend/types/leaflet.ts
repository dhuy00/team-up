export interface LeafletLatLng {
  lat: number;
  lng: number;
}

export interface LeafletMapEvent {
  latlng: LeafletLatLng;
}

export interface LeafletLayer {
  addTo(target: LeafletMap | LeafletLayerGroup): this;
}

export interface LeafletMarker extends LeafletLayer {
  bindPopup(content: string | HTMLElement): this;
  openPopup(): this;
  on(event: string, handler: (e: LeafletMapEvent) => void): this;
}

export interface LeafletLayerGroup extends LeafletLayer {
  clearLayers(): this;
}

export interface LeafletMap {
  getCenter(): LeafletLatLng;
  on(event: string, handler: (e: LeafletMapEvent) => void): this;
  remove(): void;
  invalidateSize(): void;
  removeLayer(layer: LeafletLayer): void;
  flyTo(
    latlng: [number, number],
    zoom?: number,
    options?: { duration?: number }
  ): void;
}

export interface LeafletStatic {
  map(
    element: HTMLElement,
    options: {
      center: [number, number];
      zoom: number;
      zoomControl?: boolean;
    }
  ): LeafletMap;
  control: {
    zoom(options: { position: string }): { addTo(map: LeafletMap): void };
  };
  tileLayer(
    urlTemplate: string,
    options: { attribution: string; maxZoom: number }
  ): LeafletLayer;
  layerGroup(): LeafletLayerGroup;
  circle(
    latlng: [number, number],
    options: {
      radius: number;
      color: string;
      weight: number;
      dashArray?: string;
      fillColor: string;
      fillOpacity: number;
      interactive?: boolean;
    }
  ): LeafletLayer;
  divIcon(options: {
    html: string;
    className: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
    popupAnchor?: [number, number];
  }): unknown;
  marker(
    latlng: [number, number],
    options: { icon: unknown; zIndexOffset?: number }
  ): LeafletMarker;
}

declare global {
  interface Window {
    L?: LeafletStatic;
  }
}
