import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RickMortyService } from './services/rick-morty.service';
import { Character } from './models/nasa.models';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="shell">
    <header class="top">
      <div class="brand">
        <div class="logo">RM</div>
        <div class="title">
          <h1>Rick & Morty Character Finder</h1>
          <p>Consumes <span class="mono">GET /api/character/&#123;id&#125;</span> and renders a neat little card.</p>
        </div>
      </div>

      <div class="controls card">
        <label class="lbl">Character ID</label>
        <div class="row">
          <input
            class="input"
            type="number"
            min="1"
            [(ngModel)]="characterId"
            (keyup.enter)="load()"
            placeholder="e.g. 108" />
          <button class="btn" (click)="load()" [disabled]="state() === 'loading'">
            <span *ngIf="state() !== 'loading'">Fetch</span>
            <span *ngIf="state() === 'loading'" class="spinner" aria-label="loading"></span>
          </button>
        </div>

        <div class="hint">
          Tip: try <button class="link" (click)="quick(1)">1</button>,
          <button class="link" (click)="quick(2)">2</button>,
          <button class="link" (click)="quick(108)">108</button>,
          <button class="link" (click)="quick(826)">826</button>.
        </div>
      </div>
    </header>

    <main class="grid">
      <section class="card hero" *ngIf="state() === 'idle'">
        <h2>Ready when you are ✨</h2>
        <p>Enter an ID and hit <b>Fetch</b>. This UI will call the public Rick & Morty API and show the character info.</p>
        <div class="mini">
          <div class="pill">No libraries</div>
          <div class="pill">Standalone component</div>
          <div class="pill">HttpClient (fetch adapter)</div>
        </div>
      </section>

      <section class="card hero" *ngIf="state() === 'error'">
        <h2>That ID didn't work 👀</h2>
        <p class="muted">{{ errorMsg() }}</p>
        <p class="muted">Try another ID (1..826) or check your internet connection.</p>
      </section>

      <section class="card character" *ngIf="state() === 'success' && character() as c">
        <div class="media">
          <img [src]="c.image" [alt]="c.name" />
          <div class="badge" [class.good]="badgeTone() === 'good'" [class.bad]="badgeTone() === 'bad'" [class.warn]="badgeTone() === 'warn'">
            {{ c.status }}
          </div>
        </div>

        <div class="content">
          <div class="headline">
            <h2>{{ c.name }}</h2>
            <div class="sub">
              <span class="chip">{{ c.species }}</span>
              <span class="chip" *ngIf="c.type && c.type.trim().length">{{ c.type }}</span>
              <span class="chip">{{ c.gender }}</span>
            </div>
          </div>

          <div class="facts">
            <div class="fact">
              <div class="k">Origin</div>
              <div class="v">{{ c.origin?.name || 'unknown' }}</div>
            </div>
            <div class="fact">
              <div class="k">Last known location</div>
              <div class="v">{{ c.location?.name || 'unknown' }}</div>
            </div>
            <div class="fact">
              <div class="k">Episodes</div>
              <div class="v">{{ c.episode?.length || 0 }}</div>
            </div>
            <div class="fact">
              <div class="k">Created</div>
              <div class="v">{{ prettyDate() }}</div>
            </div>
          </div>

          <div class="actions">
            <a class="btn ghost" [href]="c.url" target="_blank" rel="noreferrer">Open API URL</a>
            <a class="btn ghost" [href]="docsUrl" target="_blank" rel="noreferrer">Docs</a>
          </div>
        </div>
      </section>

      <section class="card raw" *ngIf="state() === 'success' && character() as c">
        <div class="rawTop">
          <h3>Raw JSON</h3>
          <button class="btn tiny ghost" (click)="copyJson()" [disabled]="!c">Copy</button>
        </div>
        <pre>{{ c | json }}</pre>
      </section>
    </main>

    <footer class="foot">
      <span class="muted">Angular 21 + HttpClient. Endpoint: </span>
      <span class="mono">{{ endpointPreview() }}</span>
    </footer>
  </div>
  `,
  styles: [`
    .shell{ max-width: 1080px; margin: 0 auto; padding: 28px 18px 26px; }
    .top{ display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; align-items: start; }
    @media (max-width: 940px){ .top{ grid-template-columns: 1fr; } }

    .brand{ display:flex; gap: 14px; align-items: center; }
    .logo{
      width: 52px; height: 52px; border-radius: 16px;
      background: linear-gradient(135deg, rgba(85,96,255,.85), rgba(0,255,174,.72));
      display:grid; place-items:center;
      font-weight: 800; letter-spacing: .5px;
      box-shadow: var(--shadow);
    }
    .title h1{ margin:0; font-size: 22px; }
    .title p{ margin: 4px 0 0; color: var(--muted); font-size: 13px; }

    .card{
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 18px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(10px);
    }

    .controls{ padding: 14px; }
    .lbl{ display:block; color: var(--muted); font-size: 12px; margin-bottom: 6px; }
    .row{ display:flex; gap: 10px; }
    .input{
      flex: 1;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: rgba(0,0,0,.22);
      color: var(--text);
      outline: none;
    }
    .input:focus{ border-color: rgba(85,96,255,.65); box-shadow: 0 0 0 3px rgba(85,96,255,.15); }

    .btn{
      border: 1px solid rgba(255,255,255,.16);
      background: rgba(255,255,255,.10);
      color: var(--text);
      padding: 10px 14px;
      border-radius: 14px;
      cursor: pointer;
      transition: transform .06s ease, background .15s ease, border-color .15s ease;
      user-select: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
    }
    .btn:hover{ transform: translateY(-1px); border-color: rgba(255,255,255,.24); background: rgba(255,255,255,.14); }
    .btn:disabled{ opacity: .55; cursor: not-allowed; transform:none; }
    .btn.ghost{ background: transparent; }
    .btn.tiny{ padding: 7px 10px; border-radius: 12px; font-size: 12px; }

    .spinner{
      width: 16px; height: 16px; border-radius: 999px;
      border: 2px solid rgba(255,255,255,.25);
      border-top-color: rgba(255,255,255,.90);
      animation: spin .8s linear infinite;
    }
    @keyframes spin{ to{ transform: rotate(360deg);} }

    .hint{ margin-top: 10px; color: var(--muted); font-size: 12px; }
    .link{
      background: transparent; border: none; color: rgba(0,255,174,.95);
      cursor:pointer; padding: 0 2px; font-weight: 700;
    }
    .link:hover{ text-decoration: underline; }

    .grid{ margin-top: 18px; display:grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    @media (max-width: 940px){ .grid{ grid-template-columns: 1fr; } }

    .hero{ padding: 18px; }
    .hero h2{ margin: 0 0 6px; }
    .hero p{ margin: 0; color: var(--muted); line-height: 1.4; }
    .mini{ display:flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
    .pill{
      padding: 7px 10px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--chip);
      font-size: 12px;
      color: var(--muted);
    }

    .character{ display:grid; grid-template-columns: 220px 1fr; overflow:hidden; }
    @media (max-width: 560px){ .character{ grid-template-columns: 1fr; } }

    .media{ position: relative; }
    .media img{ width: 100%; height: 100%; object-fit: cover; display:block; min-height: 220px; }
    .badge{
      position:absolute; left: 12px; bottom: 12px;
      padding: 7px 10px;
      border-radius: 999px;
      background: rgba(0,0,0,.40);
      border: 1px solid rgba(255,255,255,.18);
      font-weight: 800;
      font-size: 12px;
      letter-spacing: .2px;
    }
    .badge.good{ box-shadow: 0 0 0 3px rgba(66,245,141,.12); border-color: rgba(66,245,141,.45); }
    .badge.warn{ box-shadow: 0 0 0 3px rgba(245,209,66,.12); border-color: rgba(245,209,66,.45); }
    .badge.bad { box-shadow: 0 0 0 3px rgba(255,85,113,.12); border-color: rgba(255,85,113,.45); }

    .content{ padding: 16px; }
    .headline h2{ margin: 0; font-size: 22px; }
    .sub{ margin-top: 10px; display:flex; gap: 8px; flex-wrap: wrap; }
    .chip{
      padding: 7px 10px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(0,0,0,.18);
      font-size: 12px;
      color: var(--muted);
    }

    .facts{ margin-top: 14px; display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 560px){ .facts{ grid-template-columns: 1fr; } }
    .fact{
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: rgba(0,0,0,.16);
    }
    .k{ font-size: 11px; color: var(--muted); }
    .v{ margin-top: 3px; font-weight: 700; }

    .actions{ margin-top: 14px; display:flex; gap: 10px; flex-wrap: wrap; }

    .raw{ padding: 14px; }
    .rawTop{ display:flex; justify-content: space-between; align-items:center; gap: 10px; }
    .raw h3{ margin: 0; }
    pre{
      margin: 10px 0 0;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: rgba(0,0,0,.22);
      overflow: auto;
      color: rgba(255,255,255,.86);
      font-size: 12px;
      line-height: 1.35;
    }

    .foot{
      margin-top: 18px;
      padding: 12px 14px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font-size: 12px;
      display:flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items:center;
      justify-content: center;
    }

    .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; }
    .muted{ color: var(--muted); }
  `]
})
export class AppComponent {
  docsUrl = 'https://rickandmortyapi.com/documentation';

  characterId: number = 108;

  state = signal<LoadState>('idle');
  character = signal<Character | null>(null);
  errorMsg = signal<string>('');

  endpointPreview = computed(() => `https://rickandmortyapi.com/api/character/${this.characterId || ''}`);

  badgeTone = computed(() => {
    const c = this.character();
    if (!c) return 'warn';
    if (c.status === 'Alive') return 'good';
    if (c.status === 'Dead') return 'bad';
    return 'warn';
  });

  constructor(private rm: RickMortyService) {}

  ngOnInit(): void {
    // Load the example from your screenshot by default 🙂
    this.load();
  }

  quick(id: number): void {
    this.characterId = id;
    this.load();
  }

  load(): void {
    const id = Number(this.characterId);
    if (!Number.isFinite(id) || id <= 0) {
      this.state.set('error');
      this.errorMsg.set('Please enter a valid numeric ID (>= 1).');
      return;
    }

    this.state.set('loading');
    this.errorMsg.set('');
    this.character.set(null);

    this.rm.getCharacter(id).subscribe({
      next: (c) => {
        this.character.set(c);
        this.state.set('success');
      },
      error: (err) => {
        const msg =
          err?.status === 404 ? 'Character not found (404).' :
          err?.message ? String(err.message) :
          'Unknown error calling the API.';
        this.errorMsg.set(msg);
        this.state.set('error');
      }
    });
  }

  prettyDate(): string {
    const c = this.character();
    if (!c?.created) return '';
    const d = new Date(c.created);
    if (Number.isNaN(d.getTime())) return c.created;
    return d.toLocaleString();
  }

  async copyJson(): Promise<void> {
    const c = this.character();
    if (!c) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(c, null, 2));
    } catch {
      // Clipboard may be blocked; ignore.
    }
  }
}
