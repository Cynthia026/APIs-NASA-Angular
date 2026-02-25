import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NasaService } from './services/nasa.service';

import {
  ApodResponse, NeoResponse, NasaSearchResponse, DonkiResponse,
  EonetResponse, InsightWeatherResponse
} from './models/nasa.models';

type ViewModel = 'APOD' | 'WEATHER' | 'NEO' | 'EONET' | 'SEARCH' | 'DONKI';
type LoadState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="shell">
    <header class="top">
      <div class="brand">
        <div class="logo">NASA</div>
        <div class="title">
          <h1>Explorer API</h1>
          <p>Practice with 6 different endpoints</p>
        </div>
      </div>

      <div class="nav-pills">
        <button class="pill-btn" [class.active]="view() === 'APOD'" (click)="setView('APOD')">APOD</button>
        <button class="pill-btn" [class.active]="view() === 'WEATHER'" (click)="setView('WEATHER')">Mars Weather</button>
        <button class="pill-btn" [class.active]="view() === 'NEO'" (click)="setView('NEO')">Asteroids</button>
        <button class="pill-btn" [class.active]="view() === 'EONET'" (click)="setView('EONET')">Events</button>
        <button class="pill-btn" [class.active]="view() === 'SEARCH'" (click)="setView('SEARCH')">Search</button>
        <button class="pill-btn" [class.active]="view() === 'DONKI'" (click)="setView('DONKI')">Solar</button>
      </div>

      <div class="endpoint-info">
        <span class="method">GET</span>
        <span class="url">{{ endpointDisplay() }}</span>
      </div>
    </header>

    <main class="grid">
      <div class="full-width" *ngIf="state() === 'loading'">
        <div class="card hero center">
          <span class="spinner"></span>
          <p>Connecting to space...</p>
        </div>
      </div>

      <div class="full-width" *ngIf="state() === 'error'">
        <div class="card hero error">
          <h2>Houston, we have a problem 💥</h2>
          <p>{{ errorMsg() }}</p>
        </div>
      </div>

      <section class="card character full-width" *ngIf="view() === 'APOD' && state() === 'success' && apodData() as a">
        <div class="media">
          <img [src]="a.url" [alt]="a.title" *ngIf="a.media_type === 'image'" />
          <iframe [src]="a.url" *ngIf="a.media_type === 'video'" frameborder="0"></iframe>
        </div>
        <div class="content">
          <div class="headline">
            <h2>{{ a.title }}</h2>
            <span class="chip">{{ a.date }}</span>
          </div>
          <p class="desc">{{ a.explanation }}</p>
        </div>
      </section>

      <section class="full-width" *ngIf="view() === 'WEATHER' && state() === 'success'">
        <div class="card hero center" *ngIf="weatherData()?.sol_keys?.length === 0">
           <h2>No recent data 🌬️</h2>
           <p class="muted">The InSight lander retired in Dec 2022. The API returned an empty current dataset.</p>
        </div>

        <div class="gallery" *ngIf="(weatherData()?.sol_keys?.length || 0) > 0">
          <div class="card" *ngFor="let sol of weatherData()?.sol_keys" style="padding: 15px;">
            <h3 style="margin-top:0; color:#fc3d21; font-size:18px;">Sol {{ sol }}</h3>
            
            <div *ngIf="weatherData()?.[sol] as dayData" style="margin-top: 10px;">
              <p class="desc" style="font-size:13px; margin: 5px 0;">
                <strong>Temp:</strong> {{ dayData.AT?.av ? (dayData.AT.av | number:'1.1-1') + ' °C' : 'N/A' }}
              </p>
              <p class="desc" style="font-size:13px; margin: 5px 0;">
                <strong>Wind:</strong> {{ dayData.HWS?.av ? (dayData.HWS.av | number:'1.1-1') + ' m/s' : 'N/A' }}
              </p>
              <p class="desc" style="font-size:13px; margin: 5px 0;">
                <strong>Pressure:</strong> {{ dayData.PRE?.av ? (dayData.PRE.av | number:'1.1-1') + ' Pa' : 'N/A' }}
              </p>
            </div>
            <span class="chip" style="margin-top: 10px;">Elysium Planitia</span>
          </div>
        </div>
      </section>

      <section class="card raw full-width" *ngIf="view() === 'NEO' && state() === 'success'">
        <h3>Nearby Asteroids (Count: {{ neoData()?.element_count }})</h3>
        <div class="list-container">
            <div *ngFor="let dateKey of getNeoKeys()">
                <div class="neo-item" *ngFor="let ast of neoData()?.near_earth_objects?.[dateKey]">
                    <div class="k">{{ ast.name }}</div>
                    <div class="v">
                        Diam: {{ ast.estimated_diameter.kilometers.estimated_diameter_max | number:'1.2-2' }} km
                        <span class="badge bad" *ngIf="ast.is_potentially_hazardous_asteroid">HAZARDOUS</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <section class="card raw full-width" *ngIf="view() === 'EONET' && state() === 'success'">
        <h3>Live Earth Events (Wildfires, Volcanoes, etc.)</h3>
        <table class="simple-table">
            <tr>
                <th>Event Title</th>
                <th>Category</th>
                <th>Date</th>
            </tr>
            <tr *ngFor="let event of eonetData()?.events">
                <td>{{ event.title }}</td>
                <td><span class="badge warn">{{ event.categories[0]?.title }}</span></td>
                <td>{{ event.geometries[0]?.date | date:'shortDate' }}</td>
            </tr>
        </table>
      </section>

      <section class="full-width" *ngIf="view() === 'SEARCH'">
         <div class="controls card" style="margin-bottom: 20px;">
            <div class="row">
                <input class="input" [(ngModel)]="searchQuery" (keyup.enter)="loadSearch()" placeholder="Search (e.g., moon, apollo)...">
                <button class="btn" (click)="loadSearch()">Search</button>
            </div>
         </div>
         <div class="gallery" *ngIf="state() === 'success'">
            <div class="card" *ngFor="let item of searchData()?.collection?.items?.slice(0, 6)">
                <img [src]="item.links?.[0]?.href" class="gallery-img" *ngIf="item.links?.length">
                <div class="info-row">
                    <span class="chip truncate">{{ item.data[0].title }}</span>
                </div>
            </div>
         </div>
      </section>

      <section class="card raw full-width" *ngIf="view() === 'DONKI' && state() === 'success'">
        <h3>Solar Flares Report</h3>
        <table class="simple-table">
            <tr>
                <th>ID</th>
                <th>Class</th>
                <th>Time</th>
            </tr>
            <tr *ngFor="let flare of donkiData()?.slice(0,10)">
                <td>{{ flare.flrID }}</td>
                <td>{{ flare.classType }}</td>
                <td>{{ flare.peakTime | date:'short' }}</td>
            </tr>
        </table>
      </section>
    </main>
  </div>
  `,
  styles: [`
    .shell{ max-width: 1080px; margin: 0 auto; padding: 28px 18px 26px; }
    .top{ display: flex; flex-direction: column; gap: 18px; align-items: center; margin-bottom: 20px; }
    .brand{ display:flex; gap: 14px; align-items: center; }
    .logo{ width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #0B3D91, #FC3D21); display:grid; place-items:center; color: white; font-weight: 800; letter-spacing: .5px; }
    .title h1{ margin:0; font-size: 22px; color: #fff; }
    .title p{ margin: 4px 0 0; color: #aaa; font-size: 13px; }

    .nav-pills { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .pill-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #aaa; padding: 8px 16px; border-radius: 20px; cursor: pointer; transition: all 0.2s; }
    .pill-btn:hover { background: rgba(255,255,255,0.15); }
    .pill-btn.active { background: #0B3D91; color: white; border-color: #4facfe; box-shadow: 0 0 10px rgba(79, 172, 254, 0.4); }

    .endpoint-info { background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); padding: 12px 20px; border-radius: 8px; display: flex; align-items: center; gap: 12px; font-family: ui-monospace, monospace; font-size: 14px; width: 100%; max-width: 800px; margin-top: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .method { color: #4facfe; font-weight: bold; background: rgba(79, 172, 254, 0.15); padding: 4px 8px; border-radius: 4px; }
    .url { color: #a8b2d1; word-break: break-all; }

    .card{ background: #1a1a1a; border: 1px solid #333; border-radius: 18px; overflow: hidden; }
    .raw { padding: 20px; }
    .full-width { grid-column: 1 / -1; width: 100%; }
    .grid { display: grid; gap: 20px; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
    .gallery-img { width: 100%; height: 150px; object-fit: cover; display: block; }
    .info-row { padding: 10px; display: flex; gap: 5px; flex-wrap: wrap; }
    .media img { width: 100%; max-height: 500px; object-fit: contain; }
    .content { padding: 20px; color: #ddd; }
    .desc { line-height: 1.6; color: #bbb; }
    .chip { background: #333; padding: 4px 8px; border-radius: 4px; font-size: 11px; color: #aaa; display: inline-block;}
    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .input { background: #222; border: 1px solid #444; color: white; padding: 10px; border-radius: 8px; flex: 1; }
    .btn { background: #0B3D91; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
    .neo-item { padding: 10px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; }
    .simple-table { width: 100%; color: #ccc; text-align: left; border-collapse: collapse; margin-top: 15px;}
    .simple-table th { border-bottom: 1px solid #444; padding: 8px; }
    .simple-table td { border-bottom: 1px solid #222; padding: 8px; font-size: 13px; }
    .spinner { width: 24px; height: 24px; border-radius: 50%; border: 3px solid rgba(255,255,255,.3); border-top-color: white; animation: spin 1s linear infinite; display: inline-block; }
    @keyframes spin{ to{ transform: rotate(360deg);} }
    .center { text-align: center; padding: 40px; }
    .badge.bad { background: #d32f2f; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 5px;}
    .badge.warn { background: #f57c00; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;}
  `]
})
export class AppComponent {
  view = signal<ViewMode>('APOD');
  state = signal<LoadState>('idle');
  errorMsg = signal<string>('');

  apodData = signal<ApodResponse | null>(null);
  weatherData = signal<InsightWeatherResponse | null>(null);
  neoData = signal<NeoResponse | null>(null);
  eonetData = signal<EonetResponse | null>(null);
  searchData = signal<NasaSearchResponse | null>(null);
  donkiData = signal<DonkiResponse[] | null>(null);

  searchQuery: string = '';

  endpointDisplay = computed(() => {
    const base = 'https://api.nasa.gov';
    switch (this.view()) {
      case 'APOD': return `${base}/planetary/apod`;
      case 'WEATHER': return `${base}/insight_weather/?feedtype=json&ver=1.0`;
      case 'NEO': return `${base}/neo/rest/v1/feed`;
      case 'EONET': return `https://eonet.gsfc.nasa.gov/api/v3/events`;
      case 'SEARCH': return `https://images-api.nasa.gov/search`;
      case 'DONKI': return `${base}/DONKI/FLR`;
      default: return '';
    }
  });

  constructor(private nasa: NasaService) {}

  ngOnInit() { this.loadData('APOD'); }

  setView(mode: ViewMode) {
    this.view.set(mode);
    this.loadData(mode);
  }

  loadSearch() {
      if(!this.searchQuery) return;
      this.loadData('SEARCH');
  }

  loadData(mode: ViewMode) {
    this.state.set('loading');
    this.errorMsg.set('');

    switch (mode) {
      case 'APOD':
        this.nasa.getApod().subscribe({ next: (res) => { this.apodData.set(res); this.state.set('success'); }, error: (e) => this.handleError(e) });
        break;
      case 'WEATHER':
        if (this.weatherData()) { this.state.set('success'); return; } 
        this.nasa.getMarsWeather().subscribe({ next: (res) => { this.weatherData.set(res); this.state.set('success'); }, error: (e) => this.handleError(e) });
        break;
      case 'NEO':
        if (this.neoData()) { this.state.set('success'); return; }
        this.nasa.getAsteroids().subscribe({ next: (res) => { this.neoData.set(res); this.state.set('success'); }, error: (e) => this.handleError(e) });
        break;
      case 'EONET':
        if (this.eonetData()) { this.state.set('success'); return; }
        this.nasa.getEonetEvents().subscribe({ next: (res) => { this.eonetData.set(res); this.state.set('success'); }, error: (e) => this.handleError(e) });
        break;
      case 'SEARCH':
        this.nasa.search(this.searchQuery).subscribe({ next: (res) => { this.searchData.set(res); this.state.set('success'); }, error: (e) => this.handleError(e) });
        break;
      case 'DONKI':
        if (this.donkiData()) { this.state.set('success'); return; }
        this.nasa.getSolarFlares().subscribe({ next: (res) => { this.donkiData.set(res); this.state.set('success'); }, error: (e) => this.handleError(e) });
        break;
    }
  }

  handleError(err: any) {
    this.state.set('error');
    this.errorMsg.set('Failed to fetch data from NASA API. Check your API Key or connection.');
    console.error(err);
  }

  getNeoKeys(): string[] {
    const data = this.neoData();
    return data ? Object.keys(data.near_earth_objects) : [];
  }
}