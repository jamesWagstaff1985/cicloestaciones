import * as L from 'leaflet';

export class DataMarker extends L.Marker {
  data: any;

  constructor(latLng: L.LatLngExpression, data: any, options?: L.MarkerOptions) {
    super(latLng, options);
    this.setData(data);
  }

  getData() {
    return this.data;
  }

  setData(data: any) {
    this.data = data;
  }
}