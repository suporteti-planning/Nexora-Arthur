/**
 * DeptShell — shell genérico para painéis de departamento.
 * Encapsula: topbar, sidebar, canvas animado, conta e logout.
 * Cada departamento fornece seus próprios @Input() para personalização.
 */
import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, signal, inject, PLATFORM_ID, NgZone, HostListener,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import gsap from 'gsap';

export interface DeptNavItem {
  label: string;
  route: string;
  icon:  string; // SVG path d
  exact?: boolean;
}

@Component({
  selector: 'app-dept-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
<div class="ds-shell" [style.--ds-accent]="accentColor" [style.--ds-accent-rgb]="accentRgb">
  <canvas #bgCanvas class="ds-canvas" aria-hidden="true"></canvas>

  <!-- Topbar -->
  <header class="ds-topbar">
    <div class="ds-topbar-inner">
      <div class="ds-brand">
        <div class="ds-brand-icon" [style.background]="'rgba('+accentRgb+',.1)'"
             [style.border-color]="'rgba('+accentRgb+',.2)'" [style.color]="accentColor">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"
               aria-hidden="true"><path [attr.d]="brandIconPath"/></svg>
        </div>
        <div class="ds-brand-text">
          <span class="ds-brand-name">Nexora</span>
          <span class="ds-brand-sub" [style.color]="accentColor + '88'">{{ deptLabel }}</span>
        </div>
      </div>

      <div class="ds-topbar-right">
        <a routerLink="/home" class="ds-icon-btn" title="Início" aria-label="Início">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </a>
        <div class="ds-acct-anchor">
          <button class="ds-user-btn" (click)="toggleMenu()" [attr.aria-expanded]="menuOpen()">
            <div class="ds-avatar" [style.background]="'rgba('+accentRgb+',.15)'"
                 [style.border-color]="accentColor" [style.color]="accentColor">
              {{ user()?.initials ?? '?' }}
            </div>
            <span class="ds-user-name">{{ user()?.displayName ?? 'Usuário' }}</span>
          </button>
          @if (menuOpen()) {
            <div class="ds-dropdown" role="menu">
              <div class="ds-dropdown-info">
                <span class="ds-dropdown-name">{{ user()?.displayName }}</span>
                <span class="ds-dropdown-email">{{ user()?.email }}</span>
              </div>
              <div class="ds-dropdown-sep"></div>
              <button class="ds-dropdown-item ds-dropdown-item--danger" role="menuitem" (click)="logout()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sair
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  </header>

  <!-- Body -->
  <div class="ds-body">
    <!-- Sidebar -->
    <aside class="ds-sidebar">
      <nav class="ds-nav">
        <p class="ds-nav-label" aria-hidden="true">NAVEGAÇÃO</p>
        <a routerLink="/home" class="ds-nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Início</span>
        </a>
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="ds-nav-item--active"
             [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
             class="ds-nav-item" [attr.aria-label]="item.label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path [attr.d]="item.icon"/>
            </svg>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
      <div class="ds-sidebar-footer">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8" [attr.stroke]="accentColor" stroke-width="1.5"/>
          <circle cx="10" cy="10" r="3" [attr.fill]="accentColor" opacity=".85"/>
        </svg>
        <span class="ds-footer-tag">Conectando pessoas, processos e resultados.</span>
      </div>
    </aside>

    <!-- Main -->
    <main class="ds-main">
      <ng-content></ng-content>
    </main>
  </div>
</div>`,
  styleUrl: './dept-shell.css',
})
export class DeptShell implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() accentColor   = '#00FF66';
  @Input() accentRgb     = '0,255,102';
  @Input() deptLabel     = 'Departamento';
  @Input() brandIconPath = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z';
  @Input() navItems: DeptNavItem[] = [];

  private readonly auth = inject(AuthService);
  private readonly pid  = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);
  readonly user = this.auth.sessionUser;

  menuOpen = signal(false);
  toggleMenu(): void { this.menuOpen.update(v => !v); }
  logout():     void { this.auth.logout(); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!(e.target as HTMLElement).closest('.ds-acct-anchor')) this.menuOpen.set(false);
  }

  private raf = 0;
  private mx = 0; private my = 0;
  private nodes: {x:number;y:number;vx:number;vy:number;r:number;pulse:number;pspd:number;br:number}[] = [];
  private onR!: () => void; private onM!: (e:MouseEvent) => void;
  private gsapCtx: gsap.Context | null = null;

  ngOnInit(): void {}
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.pid)) return;
    this.mx = window.innerWidth/2; this.my = window.innerHeight/2;
    cancelAnimationFrame(this.raf);
    this.zone.runOutsideAngular(() =>
      requestAnimationFrame(() => requestAnimationFrame(() => this.boot()))
    );
    const red = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!red) {
      this.gsapCtx = gsap.context(() => {
        gsap.timeline({ defaults: { ease:'power3.out' } })
          .fromTo('.ds-topbar', { opacity:0, y:-12 }, { opacity:1, y:0, duration:.45 })
          .fromTo('.ds-main',   { opacity:0, y:14  }, { opacity:1, y:0, duration:.45 }, '-=.25');
      });
    }
  }
  ngOnDestroy(): void {
    this.gsapCtx?.revert(); cancelAnimationFrame(this.raf);
    if (this.onR) window.removeEventListener('resize',    this.onR);
    if (this.onM) window.removeEventListener('mousemove', this.onM);
  }

  private boot(): void {
    const cv = this.canvasRef?.nativeElement;
    if (!cv) { this.zone.runOutsideAngular(() => requestAnimationFrame(() => this.boot())); return; }
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio||1, 1.5);
    const res = () => {
      const w=window.innerWidth, h=window.innerHeight;
      cv.width=w*dpr; cv.height=h*dpr; cv.style.width=`${w}px`; cv.style.height=`${h}px`;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const n=Math.max(40, Math.min(110, Math.floor(w*h/14000)));
      this.nodes=Array.from({length:n},()=>({
        x:Math.random()*w, y:Math.random()*h,
        vx:(Math.random()-.5)*.28, vy:(Math.random()-.5)*.28,
        r:1.2+Math.random()*1.8, pulse:Math.random()*Math.PI*2,
        pspd:.012+Math.random()*.018, br:.35+Math.random()*.65,
      }));
    };
    if (this.onR) window.removeEventListener('resize', this.onR);
    this.onR = res; window.addEventListener('resize', res); res();
    if (!window.matchMedia('(hover:none)').matches) {
      if (this.onM) window.removeEventListener('mousemove', this.onM);
      this.onM = (e:MouseEvent)=>{this.mx=e.clientX; this.my=e.clientY;};
      window.addEventListener('mousemove', this.onM, {passive:true});
    }
    cancelAnimationFrame(this.raf);
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      const W=cv.width/dpr, H=cv.height/dpr;
      for (const n of this.nodes) {
        const dx=this.mx-n.x, dy=this.my-n.y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<200&&d>1){n.vx+=dx*.00018;n.vy+=dy*.00018;}
        n.vx*=.992;n.vy*=.992;n.x+=n.vx;n.y+=n.vy;
        if(n.x<0){n.x=0;n.vx*=-1;}if(n.x>W){n.x=W;n.vx*=-1;}
        if(n.y<0){n.y=0;n.vy*=-1;}if(n.y>H){n.y=H;n.vy*=-1;}
        n.pulse+=n.pspd;
      }
      this.draw(ctx,cv,dpr);
    };
    loop();
  }

  private draw(ctx:CanvasRenderingContext2D, cv:HTMLCanvasElement, dpr:number): void {
    const W=cv.width/dpr, H=cv.height/dpr, cx=W*.5, cy=H*.5;
    ctx.fillStyle='#0B0F0D'; ctx.fillRect(0,0,W,H);
    const bg=ctx.createRadialGradient(cx,cy*.6,0,cx,cy*.6,W*.65);
    bg.addColorStop(0,'rgba(0,80,30,.18)'); bg.addColorStop(1,'transparent');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    const mg=ctx.createRadialGradient(this.mx,this.my,0,this.mx,this.my,260);
    mg.addColorStop(0,'rgba(0,255,102,.04)'); mg.addColorStop(1,'transparent');
    ctx.fillStyle=mg; ctx.fillRect(0,0,W,H);
    const MD=155, MD2=MD*MD;
    for (let i=0;i<this.nodes.length;i++) {
      const a=this.nodes[i];
      for (let j=i+1;j<this.nodes.length;j++) {
        const b=this.nodes[j], dx=a.x-b.x, dy=a.y-b.y, dSq=dx*dx+dy*dy;
        if(dSq>MD2)continue;
        const r=1-Math.sqrt(dSq)/MD, alpha=(0.05+r*.16)*Math.min(a.br,b.br);
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=`rgba(0,220,90,${alpha})`;ctx.lineWidth=.5+r*.55;ctx.stroke();
      }
    }
    for (const n of this.nodes) {
      const pf=.85+.15*Math.sin(n.pulse), r=n.r*pf;
      const md=Math.sqrt((this.mx-n.x)**2+(this.my-n.y)**2);
      const br=Math.min(1,n.br+(md<140?.45*(1-md/140):0));
      const h=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r*5);
      h.addColorStop(0,`rgba(0,255,102,${.05*br})`);h.addColorStop(1,'transparent');
      ctx.beginPath();ctx.arc(n.x,n.y,r*5,0,Math.PI*2);ctx.fillStyle=h;ctx.fill();
      const c=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r);
      c.addColorStop(0,`rgba(180,255,200,${br})`);c.addColorStop(.5,`rgba(0,255,90,${br*.85})`);c.addColorStop(1,`rgba(0,180,60,${br*.3})`);
      ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();
    }
    const v=ctx.createRadialGradient(cx,cy,H*.35,cx,cy,H*.85);
    v.addColorStop(0,'transparent');v.addColorStop(1,'rgba(11,15,13,.72)');
    ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  }
}
