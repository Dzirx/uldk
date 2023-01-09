import "@vaadin/vaadin-button";
import "@vaadin/vaadin-combo-box";
import "@vaadin/vaadin-text-field";
import L, { LeafletMouseEvent} from "leaflet";
import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import wellknown from "wellknown/wellknown.js";

interface uldkItem {
  name: string;
  teryt: string;
}

@customElement("uldk-panel")
export class ULDKPanel extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 10px;
      background-color: white;
      width: 270px;
      height: 600px;
      min-height: 300px;
      overflow-y: none;
    }

    vaadin-text-field {
      width: 100%;
    }

    vaadin-combo-box {
      width: 100%;
    }
  `;

  @property({ type: Object }) map?: L.Map;

  @state() geojsonLayer: any = undefined;

  @state() search_types_by_option = {
    Wojewodztwo: {
      param: "GetVoivodeshipById",
      result: "voivodeship",
    },
    Powiat: {
      param: "GetCountyById",
      result: "county",
    },
    Gmina: {
      param: "GetCommuneById",
      result: "commune",
    },
    Region: {
      param: "GetRegionById",
      result: "region",
    },
    Dzialka: {
      param: "GetParcelById",
      result: "geom_wkt",
    },
  };

  wktToGeoJSON(wkt: string): GeoJSON.GeometryObject {
    return wellknown(wkt);
  }

  @query("#voivodeship")
  voivodeshipNode: any;

  @query("#county")
  countyNode: any;

  @query("#commune")
  communeNode: any;

  @query("#region")
  regionNode: any;

  @query("#parcel")
  parcelNode: any;

  @query("#parcelId")
  parcelValue: any;

  async firstUpdated(props: any) {
    super.firstUpdated(props);
    await new Promise((r) => setTimeout(r, 0));

    this.getParcelByClickOnMap();
  }

  async getAdministrativeNames(type: string, teryt: string = "") {
    const url = `https://uldk.gugik.gov.pl/?request=${this.search_types_by_option[type].param}&result=teryt,${this.search_types_by_option[type].result}&id=${teryt}`;
    const text = await fetch(url).then((r) => r.text());
    const result = text.substring(1).trim();
    const arr = result.split("\n");

    let items: uldkItem[] = [];

    arr.forEach((item) => {
      const itemSplit = item.split("|");
      items.push({ name: itemSplit[1], teryt: itemSplit[0] });
    });
    return items;
  }

  async getParcelById(type: string, teryt: string = "") {
    if (!this.geojsonLayer) {
      this.geojsonLayer = L.geoJSON(undefined, {
        onEachFeature: function (feature, layer) {
          layer.bindPopup(feature.properties.popupContent);
        },
      }).addTo(this.map!);
    }

    const url = `https://uldk.gugik.gov.pl/?request=${this.search_types_by_option[type].param}&result=${this.search_types_by_option[type].result}&id=${teryt}&srid=4326`;
    try{
    const text = await fetch(url).then((r) => r.text());
    
    const result = text.substring(1).trim();
    const wkt = (result.includes(";") ? result.split(";")[1] : result)
      ?.trim()
      .split("\n")[0];
    

    const wktJSON = this.wktToGeoJSON(wkt);
    const dataJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: wktJSON,
          properties: {
            popupContent: `<b>Województwo</b>: ${voivodeship} <br>
            <b>Powiat</b>:  <br>
            <b>Gmina</b>:  <br>
            <b>Nazwa obrębu: </b>:  <br>
            <b>Numer działki: </b>:  <br>
            <b>Numer ewidencyjny działki: </b>:  <br>
            `,
          },
          id: 1,
        },
      ],
    };

    this.geojsonLayer.clearLayers();
    this.geojsonLayer.addData(dataJSON);
    this.map?.fitBounds(this.geojsonLayer.getBounds(), {});
  }catch(error){
    alert('brak wynikow')
  }
  }

  async getParcelByWholeId(teryt: string = "") {
    if (!this.geojsonLayer) {
      this.geojsonLayer = L.geoJSON(undefined, {
        onEachFeature: function(feature, layer) {
          layer.bindPopup(feature.properties.popupContent)
        }
      }).addTo(this.map!);
    }

    const url = `https://uldk.gugik.gov.pl/?request=GetParcelByIdOrNr&id=${teryt}&result=geom_wkt&srid=4326`;
    const text = await fetch(url).then((r) => r.text());
    const result = text.substring(1).trim();
    const wkt = (result.includes(";") ? result.split(";")[1] : result)
      ?.trim()
      .split("\n")[0];

    const wktJSON = this.wktToGeoJSON(wkt);
    const dataJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: wktJSON,
          properties: {
            popupContent: `<b>Województwo</b>: ${voivodeship} <br>
            <b>Powiat</b>:  <br>
            <b>Gmina</b>:  <br>
            <b>Nazwa obrębu: </b>:  <br>
            <b>Numer działki: </b>:  <br>
            <b>Numer ewidencyjny działki: </b>:  <br>
            `,
          },
          id: 1,
        },
      ],
    };
    this.geojsonLayer.clearLayers();
    this.geojsonLayer.addData(dataJSON);
    this.map?.fitBounds(this.geojsonLayer.getBounds(), {})
  }

   getParcelByClickOnMap(type: string = "Działka", x?: string, y?: string) {
    if (!this.geojsonLayer) {
      this.geojsonLayer = L.geoJSON(undefined, {
        onEachFeature: function (feature, layer) {
          layer.bindPopup(feature.properties.popupContent);
        },
      }).addTo(this.map!);
    }

    this.map!.on("click", async (e: LeafletMouseEvent) => {
      const yy = e.latlng.lat;

      const xx = e.latlng.lng;

      const url = `https://uldk.gugik.gov.pl/?request=GetParcelByXY&result=geom_wkt,&srid=4326&xy=${xx},${yy},4326`;
      const text = await fetch(url).then((r) => r.text());
      const result = text.substring(1).trim();
      const wkt = (result.includes(";") ? result.split(";")[1] : result)
        ?.trim()
        .split("\n")[0];

      console.log(url);
      console.log(text);


      const wktJSON = this.wktToGeoJSON(wkt);
      const dataJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: wktJSON,
            properties: {
            popupContent: `<b>Województwo</b>:  <br>
            <b>Powiat</b>:  <br>
            <b>Gmina</b>:  <br>
            <b>Nazwa obrębu: </b>:  <br>
            <b>Numer działki: </b>: <br>
            <b>Numer ewidencyjny działki: </b>:  <br>
            `,
          },
            id: 3,
          },
        ],
      };
      this.geojsonLayer.clearLayers();
      this.geojsonLayer.addData(dataJSON);
      this.map?.fitBounds(this.geojsonLayer.getBounds(), {});
    });
  }

  render() {
    return html`
      <h4>Pobieranie działek</h4>
      <vaadin-combo-box
        id="voivodeship"
        item-label-path="name"
        item-value-path="teryt"
        clear-button-visible
        label="Wybierz województwo"
        @selected-item-changed=${(e) => {
          this.countyNode.value = "";
          this.countyNode.items = [];
          this.countyNode.selectedItem = undefined;
        }}
        .dataProvider=${async (params, callback) => {
          let { filter } = params;
          let data = await this.getAdministrativeNames("Wojewodztwo");
          callback(data, data.length);
        }}
        @change=${async (e) => {
          this.countyNode.items = await this.getAdministrativeNames(
            "Powiat",
            e.target.value
          );
        }}
        }
      ></vaadin-combo-box>
      <vaadin-combo-box
        id="county"
        item-label-path="name"
        item-value-path="teryt"
        clear-button-visible
        label="Wybierz powiat"
        @selected-item-changed=${(e) => {
          this.communeNode.value = "";
          this.communeNode.items = [];
          this.communeNode.selectedItem = undefined;
        }}
        @change=${async (e) => {
          this.communeNode.items = await this.getAdministrativeNames(
            "Gmina",
            e.target.value
          );
        }}
        }
      ></vaadin-combo-box>
      <vaadin-combo-box
        id="commune"
        item-label-path="name"
        item-value-path="teryt"
        clear-button-visible
        label="Wybierz gminę"
        @selected-item-changed=${(e) => {
          this.regionNode.value = "";
          this.regionNode.items = [];
          this.regionNode.selectedItem = undefined;
        }}
        @change=${async (e) => {
          this.regionNode.items = await this.getAdministrativeNames(
            "Region",
            e.target.value
          );
        }}
      ></vaadin-combo-box>
      <vaadin-combo-box
        id="region"
        item-label-path="name"
        item-value-path="teryt"
        clear-button-visible
        label="Wybierz region"
      ></vaadin-combo-box>
      <vaadin-text-field
        id="parcel"
        label="Podaj nr działki"
      ></vaadin-text-field>
      <vaadin-button
        @click=${async (e) => {
          const teryt = `${this.regionNode.value}.${this.parcelNode.value}`;
          await this.getParcelById("Dzialka", teryt);
        }}
        >Szukaj w ULDK</vaadin-button
      >
      <vaadin-text-field
        label="Nr ewidencyjny działki:"
        helper-text="Podaj poprawny nr"
        id="parcelId"
      ></vaadin-text-field>
      <vaadin-button
        @click=${async (e) => {
          const value = `${this.parcelValue.value}`;
          await this.getParcelByWholeId(value);
        }}
        >Szukaj w ULDK</vaadin-button
      >
    `;
  }
}
