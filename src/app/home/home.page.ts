import { Component } from '@angular/core';
import { tileLayer, latLng, icon, Map } from 'leaflet';
import { HTTP } from '@ionic-native/http/ngx';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet-rotatedmarker';
import { HttpClient } from '@angular/common/http';
import { DataMarker } from './DataMarker';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  DATA_RELOAD_TIME = 1 * (1000 * 60);

  private map: Map;
  private userLoc;
  private userPositionSubscription = null;

  mapBoxOutdoors = tileLayer('https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    maxZoom: 18,
    id: 'outdoors-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiamFtZXN3YWdzdGFmZiIsImEiOiJja2hqZ2tkcnUwOWFzMnNwOWNidzlidThqIn0.RwbipqBbfeKDcGuktP4WgQ'
  })

  options = {
    layers: [
      this.mapBoxOutdoors
    ],
    renderer: L.canvas(),
    zoom: 13,
    center: latLng([19.398309, -99.173708]) // This is the aprox. center of all cicloestaciones 
  };

  userLocIcon = icon({
    iconUrl: 'assets/icon/location.png',
    iconSize: [18, 26],
    iconAnchor: [0, 0],
  });

  constructor(private httpClient: HttpClient, private http: HTTP, private geolocation: Geolocation) {
    this.configureData();
  }

  configureData() {
    if (window.hasOwnProperty('cordova')) {
      this.getDataHTTP();
    } else {
      // use angular http with proxy (for development purposes, need to configure angular.json)
      this.getDataHttpClient();
    }
    this.watchUserLocation();
  }

  httpInterval = null;

  getDataHTTP() {
    clearInterval(this.httpInterval);
    this.http.post('https://www.ecobici.cdmx.gob.mx/availability_map/getJsonObject', {}, {})
      .then(estaciones =>
        this.configureLayer((JSON.parse(estaciones.data) as any[])));
    this.httpInterval = setInterval(() => this.getDataHTTP(), this.DATA_RELOAD_TIME);
  }

  getDataHttpClient() {
    clearInterval(this.httpInterval);
    this.httpClient.post('/', {}, {}).subscribe(this.configureLayer.bind(this));
    this.httpInterval = setInterval(() => this.getDataHttpClient(), this.DATA_RELOAD_TIME);
  }

  configureLayer(estaciones): void {
    if(this.map) this.map.removeLayer(this.markerClusters);
    estaciones.forEach(this.agregarEstacion.bind(this));
    this.map.addLayer(this.markerClusters);
  }

  markerClusters = L.markerClusterGroup({
    disableClusteringAtZoom: 17,
    iconCreateFunction: (cluster) => {
      let bikeSum = 0;
      let slotSum = 0;
      cluster.getAllChildMarkers().forEach(child => {
        bikeSum += (child as any).data.bikes;
        slotSum += (child as any).data.slots;
      })
      const fillPercentage = this.calculateFillPercentage(bikeSum, slotSum);
      return this.getStationTemplate(bikeSum, fillPercentage);
    }
  });

  agregarEstacion(estacion: any) {
    const template = `
    <div>
      <p style="color: red">${estacion.name}</p>
      <p>Aparcamientos: <strong>${estacion.slots}</strong></p>
      <p>Bicis disponibles: <strong>${estacion.bikes}</strong></p>
    </div>
    `;
    const marker =
      new DataMarker(
        latLng({ "lat": estacion.lat, "lng": estacion.lon }),
        { bikes: parseInt(estacion.bikes), slots: parseInt(estacion.slots) },
        { icon: this.getStationTemplate(estacion.bikes, this.calculateFillPercentage(estacion.bikes, estacion.slots)) })
        .bindPopup(template, { offset: [0, -50] });
    this.markerClusters.addLayer(marker);
  }

  calculateFillPercentage(bikes: number, slots: number) {
    return 100 / ((slots + bikes) / bikes);
  }

  getStationTemplate(bikes, fillPercentage: number): L.DivIcon {
    const template = `<div class="cluster-marker-container"><img src="assets/icon/$ICON.png"/><p style="border-color: $BORDER_COLOR !important;">${bikes}</p></div>`;
    const divIcon: L.DivIcon = L.divIcon({ iconAnchor: [25, 50] });
    if (fillPercentage == 0) {
      divIcon.options.html = template.replace('$ICON', 'ecobici-red').replace('$BORDER_COLOR', '#ee0000');
    } else if (fillPercentage <= 20) {
      divIcon.options.html = template.replace('$ICON', 'ecobici-orange').replace('$BORDER_COLOR', '#ee9900');
    } else {
      divIcon.options.html = template.replace('$ICON', 'ecobici-green').replace('$BORDER_COLOR', '#6dc727');
    }
    return divIcon;
  }

  userPosition = null;

  watchUserLocation() {
    if(this.userPosition) this.map.flyTo(this.userPosition, 18)
    const options = {
      enableHighAccuracy: true,
    };
    const position = this.geolocation.watchPosition(options);
    this.userPositionSubscription = position.subscribe((data: Geoposition) => {
      this.userPosition = latLng(data.coords.latitude, data.coords.longitude);
      const rotationAngle = data.coords.heading ? data.coords.heading : 0;
      this.userLoc ? this.map.removeLayer(this.userLoc) : this.map.flyTo(this.userPosition, 18);
      this.userLoc = L.marker(this.userPosition, { icon: this.userLocIcon, rotationAngle }).addTo(this.map);
    });
  }

  onMapReady(map: Map) {
    this.map = map;
  }

  ngOnDestroy() {
    this.userPositionSubscription.unsubscribe();
  }

}