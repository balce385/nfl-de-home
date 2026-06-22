'use client';

import { useEffect, useRef } from 'react';

/**
 * ShaderWallpaper
 * ----------------
 * Wiederverwendbarer, animierter WebGL-Hintergrund fuer NFL-DE-Fan-Hub.
 * Portiert 1:1 aus dem "Gridiron OS"-Design (5 Live-Shader).
 *
 * Der Canvas liegt standardmaessig fixiert im Vollbild hinter dem Seiteninhalt
 * (position:fixed, inset:0, zIndex:0) und hat pointer-events:none, blockiert
 * also keine Klicks. Die Maus-/Ripple-Interaktivitaet laeuft ueber window-Listener
 * und funktioniert trotzdem.
 *
 * Wichtig: Damit der Hintergrund sichtbar ist, sollte dein Seiteninhalt in einem
 * Element mit `position: relative; z-index: 1` (oder hoeher) liegen.
 *
 * Beispiel (app/page.tsx):
 *   import ShaderWallpaper from '@/components/ShaderWallpaper';
 *   export default function Page() {
 *     return (
 *       <>
 *         <ShaderWallpaper variant="aurora" />
 *         <main style={{ position: 'relative', zIndex: 1 }}> ... </main>
 *       </>
 *     );
 *   }
 */

export type ShaderVariant = 'plasma' | 'metaballs' | 'hyperspace' | 'voronoi' | 'aurora';

export interface ShaderWallpaperProps {
  /** Welcher Shader gerendert wird. Default: 'aurora'. */
  variant?: ShaderVariant;
  /** Maus-Parallax + Klick-Ripples aktivieren. Default: true. */
  interactive?: boolean;
  /** Max. Device-Pixel-Ratio (Performance-Cap). Default: 2. */
  maxDpr?: number;
  /** Zusaetzliche CSS-Klasse fuer den Canvas. */
  className?: string;
  /** Inline-Styles, ueberschreiben die Defaults. */
  style?: React.CSSProperties;
}

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;

const HEAD = `precision highp float;
uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;
uniform vec4 u_rip[12]; uniform int u_ripN;
#define PI 3.14159265
vec2 toUV(vec2 nm){ return (2.0*nm-1.0)*vec2(u_res.x/u_res.y,1.0); }
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
vec3 pal(float t,vec3 a,vec3 b,vec3 c,vec3 d){ return a+b*cos(6.28318*(c*t+d)); }
vec3 ramp(float t,vec3 A,vec3 B,vec3 C,vec3 D){ t=clamp(t,0.0,1.0);
  if(t<0.3333) return mix(A,B,t/0.3333);
  if(t<0.6666) return mix(B,C,(t-0.3333)/0.3333);
  return mix(C,D,(t-0.6666)/0.3334); }
float hash(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y); }
vec2 hash2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<6;i++){ v+=a*noise(p); p=rot(0.5)*p*2.0; a*=0.5; } return v; }
`;

const FRAGS: Record<ShaderVariant, string> = {
  plasma: `
void main(){
  vec2 uv=toUV(gl_FragCoord.xy/u_res);
  vec2 m=toUV(u_mouse);
  float t=u_time*0.12;
  vec2 dir=uv-m; float md=length(dir);
  vec2 p=uv*1.4 + 0.55*normalize(dir+1e-4)*sin(md*3.0-u_time*1.3)*exp(-md*0.9);
  float n1=fbm(p+vec2(t,t*0.6));
  float n2=fbm(p*1.6+n1*1.6-t);
  float v=fbm(p*0.9+vec2(n1,n2)*1.2+t*0.4);
  for(int i=0;i<12;i++){ if(i>=u_ripN)break; vec4 r=u_rip[i]; float age=u_time-r.z;
    vec2 rp=toUV(r.xy); float d=length(uv-rp);
    v+=sin(d*16.0-age*7.0)*exp(-age*1.3)*exp(-d*1.7)*0.55*r.w; }
  v+=0.12*sin(u_time*0.5);
  vec3 col=ramp(v*1.05+0.05, vec3(0.05,0.06,0.18), vec3(0.10,0.30,0.72), vec3(0.30,0.78,0.96), vec3(0.86,0.40,0.92));
  col+=0.28*exp(-md*3.2)*vec3(0.5,0.85,1.0);
  col=pow(max(col,0.0),vec3(0.92));
  gl_FragColor=vec4(col,1.0);
}`,
  metaballs: `
void main(){
  vec2 uv=toUV(gl_FragCoord.xy/u_res);
  vec2 m=toUV(u_mouse);
  float t=u_time;
  float f=0.0;
  { vec2 d=uv-m; f+=0.17/dot(d,d); }
  for(int i=0;i<5;i++){ float fi=float(i);
    vec2 c=vec2(sin(t*0.31+fi*1.7)*1.0, cos(t*0.37+fi*2.3)*0.62);
    float sz=0.040+0.020*sin(fi*2.0); vec2 d=uv-c; f+=sz/dot(d,d); }
  for(int i=0;i<12;i++){ if(i>=u_ripN)break; vec4 r=u_rip[i]; float age=u_time-r.z;
    vec2 rp=toUV(r.xy); float sz=0.20*exp(-age*1.4)*(1.0-exp(-age*9.0));
    vec2 d=uv-rp; f+=sz/dot(d,d); }
  float iso=smoothstep(0.80,1.55,f);
  vec3 col=ramp(clamp(f*0.32,0.0,1.0)*0.85+0.08, vec3(0.05,0.10,0.24), vec3(0.08,0.36,0.72), vec3(0.32,0.82,0.98), vec3(0.92,0.96,1.0));
  col*=iso;
  float edge=smoothstep(0.92,1.02,f)*(1.0-smoothstep(1.02,1.35,f));
  col+=edge*vec3(0.5,0.92,1.0)*1.4;
  col+=(1.0-iso)*vec3(0.015,0.022,0.05);
  gl_FragColor=vec4(col,1.0);
}`,
  hyperspace: `
void main(){
  vec2 uv=toUV(gl_FragCoord.xy/u_res);
  vec2 m=toUV(u_mouse);
  uv-=m*0.45;
  float r=length(uv); float a=atan(uv.y,uv.x);
  float boost=0.0;
  for(int i=0;i<12;i++){ if(i>=u_ripN)break; vec4 r4=u_rip[i]; float age=u_time-r4.z;
    boost+=exp(-age*1.8)*r4.w; }
  float speed=0.55+boost*2.0;
  float z=0.30/r+u_time*speed;
  float streak=pow(noise(vec2(a*18.0, z*0.6)),2.2)*1.9;
  float rings=0.5+0.5*sin(z*7.0+a*2.0);
  float core=exp(-r*2.2);
  float b=streak*(0.45+core*1.6)+rings*0.22+core*1.1;
  vec3 col=ramp(fract(z*0.045), vec3(0.10,0.10,0.36), vec3(0.20,0.34,0.86), vec3(0.45,0.75,1.0), vec3(0.55,0.34,0.9));
  col*=b;
  col+=vec3(0.7,0.88,1.0)*core*(0.7+boost*1.6);
  col*=smoothstep(1.9,0.1,r)*0.6+0.4;
  gl_FragColor=vec4(max(col,0.0),1.0);
}`,
  voronoi: `
void main(){
  vec2 uv=toUV(gl_FragCoord.xy/u_res);
  vec2 m=toUV(u_mouse);
  vec2 g=uv*4.2; vec2 ic=floor(g); vec2 fc=fract(g);
  float f1=9.0,f2=9.0; vec2 cellId=ic;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
    vec2 o=vec2(float(x),float(y)); vec2 h=hash2(ic+o);
    vec2 pp=o+0.5+0.42*sin(u_time*0.55+6.2831*h)-fc; float d=length(pp);
    if(d<f1){ f2=f1; f1=d; cellId=ic+o; } else if(d<f2){ f2=d; } }
  float border=smoothstep(0.0,0.055,f2-f1);
  vec3 cellCol=ramp(hash(cellId), vec3(0.05,0.12,0.26), vec3(0.08,0.34,0.62), vec3(0.26,0.72,0.96), vec3(0.62,0.90,1.0));
  float dm=length(uv-m); float mg=exp(-dm*3.6);
  float rip=0.0;
  for(int i=0;i<12;i++){ if(i>=u_ripN)break; vec4 r=u_rip[i]; float age=u_time-r.z;
    vec2 rp=toUV(r.xy); float wr=age*1.25; float dd=length(uv-rp);
    rip+=exp(-abs(dd-wr)*6.0)*exp(-age*1.2)*r.w; }
  vec3 col=cellCol*(0.22+0.55*f1)*border;
  col+=cellCol*mg*1.6;
  col+=vec3(0.55,0.9,1.0)*rip;
  col+=(1.0-border)*vec3(0.5,0.82,1.0)*0.5*(mg+rip);
  gl_FragColor=vec4(col,1.0);
}`,
  aurora: `
void main(){
  vec2 uv=toUV(gl_FragCoord.xy/u_res);
  vec2 nm=gl_FragCoord.xy/u_res;
  vec2 m=toUV(u_mouse);
  vec3 col=mix(vec3(0.02,0.03,0.08), vec3(0.06,0.02,0.13), nm.y);
  float st=hash(floor(gl_FragCoord.xy/2.0));
  col+=step(0.9975,st)*vec3(0.8,0.9,1.0)*(0.5+0.5*sin(u_time*3.0+st*40.0));
  for(int i=0;i<5;i++){ float fi=float(i);
    float freq=1.2+fi*0.45; float sp=0.30+fi*0.16;
    float base=-0.55+fi*0.22;
    float y0=base+0.16*sin(uv.x*freq+u_time*sp+fi)+0.07*sin(uv.x*freq*2.3-u_time*sp*1.3);
    float infl=exp(-pow((uv.x-m.x)*1.1,2.0));
    y0+=infl*(m.y*0.45)*(0.6+0.4*sin(u_time));
    float w=0.045+0.02*sin(u_time*0.8+fi);
    float band=exp(-pow((uv.y-y0)/w,2.0));
    band*=0.55+0.45*noise(vec2(uv.x*8.0+u_time*0.5,fi*3.0));
    vec3 c=ramp(fi*0.24+0.05, vec3(0.12,0.72,0.45), vec3(0.18,0.92,0.72), vec3(0.30,0.55,0.95), vec3(0.72,0.40,0.95));
    col+=c*band*0.95;
  }
  for(int i=0;i<12;i++){ if(i>=u_ripN)break; vec4 r=u_rip[i]; float age=u_time-r.z;
    vec2 rp=toUV(r.xy); float dd=length(uv-rp); float wr=age*1.0;
    col+=vec3(0.4,0.95,0.7)*exp(-abs(dd-wr)*5.0)*exp(-age*1.5)*r.w; }
  col+=exp(-length(uv-m)*3.8)*vec3(0.18,0.5,0.4);
  gl_FragColor=vec4(col,1.0);
}`,
};

const MAXR = 12;

export default function ShaderWallpaper({
  variant = 'aurora',
  interactive = true,
  maxDpr = 2,
  className,
  style,
}: ShaderWallpaperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) {
      // WebGL nicht verfuegbar -> Komponente bleibt einfach leer.
      return;
    }

    // ---- compile helpers ----
    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      // Bei verlorenem Kontext liefert getShaderParameter null/false -> nicht loggen.
      if (!gl!.isContextLost() && !gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(s), src);
      }
      return s;
    }
    function program(frag: string) {
      const p = gl!.createProgram()!;
      gl!.attachShader(p, compile(gl!.VERTEX_SHADER, VERT));
      gl!.attachShader(p, compile(gl!.FRAGMENT_SHADER, HEAD + frag));
      gl!.linkProgram(p);
      if (!gl!.isContextLost() && !gl!.getProgramParameter(p, gl!.LINK_STATUS)) {
        console.error(gl!.getProgramInfoLog(p));
      }
      return p;
    }

    // ---- GL-Ressourcen (werden bei Kontextverlust neu erzeugt) ----
    type GLResources = {
      prog: WebGLProgram;
      loc: {
        pos: number;
        res: WebGLUniformLocation | null;
        time: WebGLUniformLocation | null;
        mouse: WebGLUniformLocation | null;
        rip: WebGLUniformLocation | null;
        ripN: WebGLUniformLocation | null;
      };
      buf: WebGLBuffer | null;
    };

    function initGL(): GLResources {
      const prog = program(FRAGS[variant]);
      const loc = {
        pos: gl!.getAttribLocation(prog, 'p'),
        res: gl!.getUniformLocation(prog, 'u_res'),
        time: gl!.getUniformLocation(prog, 'u_time'),
        mouse: gl!.getUniformLocation(prog, 'u_mouse'),
        rip: gl!.getUniformLocation(prog, 'u_rip'),
        ripN: gl!.getUniformLocation(prog, 'u_ripN'),
      };
      const buf = gl!.createBuffer();
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buf);
      gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl!.STATIC_DRAW);
      return { prog, loc, buf };
    }

    let res = initGL();

    // ---- state ----
    const mouse = { x: 0.5, y: 0.5 };
    const sm = { x: 0.5, y: 0.5 };
    let ripples: { x: number; y: number; t: number; w: number }[] = [];
    const t0 = performance.now();
    const ripBuf = new Float32Array(MAXR * 4);
    let raf = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      canvas!.width = Math.floor(window.innerWidth * dpr);
      canvas!.height = Math.floor(window.innerHeight * dpr);
      canvas!.style.width = window.innerWidth + 'px';
      canvas!.style.height = window.innerHeight + 'px';
    }
    resize();

    function addRipple(nx: number, ny: number) {
      ripples.push({ x: nx, y: ny, t: (performance.now() - t0) / 1000, w: 1.0 });
      if (ripples.length > MAXR) ripples.shift();
    }

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1 - e.clientY / window.innerHeight;
    };
    const onDown = (e: PointerEvent) => {
      addRipple(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    };

    window.addEventListener('resize', resize);
    if (interactive) {
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerdown', onDown);
    }

    // ---- Kontextverlust-Handling (z. B. GPU-Reset, Tab-Wechsel) ----
    const onLost = (e: Event) => {
      // preventDefault signalisiert dem Browser, dass wir den Kontext
      // wiederherstellen wollen -> spaeter wird 'webglcontextrestored' gefeuert.
      e.preventDefault();
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onRestored = () => {
      res = initGL();
      resize();
      if (!raf) raf = requestAnimationFrame(frame);
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    // ---- render loop ----
    function frame() {
      if (gl!.isContextLost()) {
        raf = 0;
        return;
      }
      const now = (performance.now() - t0) / 1000;
      sm.x += (mouse.x - sm.x) * 0.12;
      sm.y += (mouse.y - sm.y) * 0.12;
      ripples = ripples.filter((r) => now - r.t < 6.0);

      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.useProgram(res.prog);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, res.buf);
      gl!.enableVertexAttribArray(res.loc.pos);
      gl!.vertexAttribPointer(res.loc.pos, 2, gl!.FLOAT, false, 0, 0);
      gl!.uniform2f(res.loc.res, canvas!.width, canvas!.height);
      gl!.uniform1f(res.loc.time, now);
      gl!.uniform2f(res.loc.mouse, mouse.x, mouse.y);

      const n = Math.min(ripples.length, MAXR);
      for (let i = 0; i < n; i++) {
        const r = ripples[i];
        ripBuf[i * 4] = r.x;
        ripBuf[i * 4 + 1] = r.y;
        ripBuf[i * 4 + 2] = r.t;
        ripBuf[i * 4 + 3] = r.w;
      }
      gl!.uniform4fv(res.loc.rip, ripBuf);
      gl!.uniform1i(res.loc.ripN, n);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // ---- cleanup ----
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      gl.deleteBuffer(res.buf);
      gl.deleteProgram(res.prog);
      // WICHTIG: kein loseContext() hier. React StrictMode ruft den Effekt
      // im Dev doppelt auf (Mount -> Cleanup -> Mount). loseContext() wuerde
      // den Canvas-Kontext dauerhaft zerstoeren, sodass der zweite Mount nur
      // einen toten Kontext zurueckbekaeme -> leerer/weisser Hintergrund.
    };
  }, [variant, interactive, maxDpr]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 0,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
