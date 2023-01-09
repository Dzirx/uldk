import L from "leaflet";
import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./uldk-panel"

@customElement("main-panel")
export class MainPanel extends LitElement {
  static styles = css``;

  @state() map?: L.Map;

  @state() basemap?: L.TileLayer = new L.TileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "OpenStreetMap",
    }
  );

  initMap() {
    this.map = new L.Map("map", {
      center: new L.LatLng(51.236525, 22.4998601),
      zoom: 18,
    });
  }

  firstUpdated(props: any) {
    super.firstUpdated(props);
    this.initMap();
    this.basemap?.addTo(this.map!);
  }

  render() {
    return html`<uldk-panel .map=${this.map}></uldk-panel>`;
  }
}
