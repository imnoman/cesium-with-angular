import { Component } from '@angular/core';
import { Resource } from 'cesium';
import OLCesium from 'olcs/OLCesium';
import * as Cesium from 'cesium';


import TileWMS from 'ol/source/TileWMS';
import * as ol from 'ol';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import { get as getProjection } from 'ol/proj';
import { getTopLeft, getWidth } from 'ol/extent';
import { FormsModule } from '@angular/forms';
import { debounce } from 'lodash';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'testing_v1';
  ol3d: any;
  map: ol.Map | undefined;
  franeWMSOpacity = 1;

  debouncedSetFraneWMSOpacity(value: number) {
    this.franeWMSOpacity = value;
    this.setFraneWMSOpacity(); // Optionally, call the immediate function if needed
  }
  
  // public debouncedSetFraneWMSOpacity = debounce(this.setFraneWMSOpacity, 300);
  esriAerial!: TileLayer<XYZ>;
  googleAerial!: TileLayer<XYZ>;

  ngOnInit() {

    console.log("Component initialized successfully")

    const projection = getProjection('EPSG:3857');
    if (projection) {
      const projectionExtent = projection.getExtent();
      const size = getWidth(projectionExtent) / 256;
      const resolutions = new Array(14);
      const matrixIds = new Array(14);
      for (let z = 0; z < 14; ++z) {
        resolutions[z] = size / Math.pow(2, z);
        matrixIds[z] = z;
      }
    }
    
    this.esriAerial = new TileLayer({
      source: new XYZ({
        attributions:
          'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
          'rest/services/World_Imagery/MapServer">ArcGIS</a>',
        url:
          'https://server.arcgisonline.com/ArcGIS/rest/services/' +
          'World_Imagery/MapServer/tile/{z}/{y}/{x}',
        transition: 0,
      })
    });
    
    this.googleAerial = new TileLayer ({
      source: new XYZ({
        attributions: '(c) Google Map',
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        transition: 500,
      })
    });
    
    const franeWMSSource = new TileWMS({
      url: 'https://idrogeo.isprambiente.it/geoserver/wms',
      params: { LAYERS: 'idrogeo:frane', TILED: true },
      serverType: 'geoserver',
      transition: 500,
    });

    const map = new ol.Map({
      layers: [
        // new TileLayer({
        //   source: new XYZ({
        //     url: 'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
        //       '?apikey=d0e7a9bd1a044caf82fc228e67d09f36',
        //   }),
        // }),
        this.googleAerial,
        new TileLayer({
          opacity: 0.7,
          source: franeWMSSource,
        }),
      ],
      target: 'map',
      view: new ol.View({
        center: [10, 10],
        zoom: 2,
        projection: 'EPSG:3857',
      }),
    });

    const ol2d = map;
    this.ol3d = new OLCesium({ map: ol2d });
    const scene = this.ol3d.getCesiumScene();

    // Load Cesium terrain
    this.loadCesiumTerrain(scene);
    this.ol3d.setEnabled(true); // Commented out to avoid automatic enabling of 3D
    this.map = map;
  }

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap(){
    if(typeof Cesium ==='undefined'){
      console.error('Cesium is not defined. Make sure it is properly loaded');
      return;
    }
  }

  changeBaseLayer(ev: any) {
    if (this.map) {
      const layers = this.map.getLayers();
      const currentLayer = layers.item(0);
  
      if (ev.target.value === 'GoogleAerial') {
        // Assuming that Google Aerial is the first layer
        layers.remove(currentLayer);
        layers.insertAt(0,this.googleAerial)
      } else if (ev.target.value === 'EsriAerial') {
        // Assuming that Esri Aerial is the first layer
        layers.remove(currentLayer);
        layers.insertAt(0,this.esriAerial)
      }
    }
  }
  // async loadCesiumTerrain(scene: any) {
  //   try {
  //     const terrainProvider = await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl("https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer", {
  //       token: "KED1aF_I4UzXOHy3BnhwyBHU4l5oY6rO6walkmHoYqGp4XyIWUd5YZUC1ZrLAzvV40pR6gBXQayh0eFA8m6vPg.."
  //     });
  //     scene.terrainProvider = terrainProvider;
  //   } catch (error) {

  //     console.error('Failed to load terrain:', error);
  //     window.alert(`Failed to load terrain. ${error}`);
  //   }
  // }

  async loadCesiumTerrain(scene: any) {
    if (typeof Cesium !== 'undefined') {
      try {
        const terrainProvider = await (Cesium as any).ArcGISTiledElevationTerrainProvider.fromUrl("https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer", {
          token: "KED1aF_I4UzXOHy3BnhwyBHU4l5oY6rO6walkmHoYqGp4XyIWUd5YZUC1ZrLAzvV40pR6gBXQayh0eFA8m6vPg.."
        });
        scene.terrainProvider = terrainProvider;
      } catch (error) {
        console.error('Failed to load terrain:', error);
        window.alert(`Failed to load terrain. ${error}`);
      }
    } else {
      console.error('Cesium is not defined. Make sure it is properly loaded.');
    }
  }
  


  toggle3D() {
    if (this.ol3d) {
      console.log('Before Toggle:', this.ol3d.getEnabled());
      this.ol3d.setEnabled(!this.ol3d.getEnabled());
      console.log('After Toggle:', this.ol3d.getEnabled());
    }
  }
  


  setFraneWMSOpacity() {
    if (this.map) {
      const franeLayer = this.map.getLayers().getArray()[1]; // Assuming franeWMS is the second layer
      if (franeLayer instanceof TileLayer) {
        franeLayer.setOpacity(this.franeWMSOpacity);
      }
    }
  }
}


