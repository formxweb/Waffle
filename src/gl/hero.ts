import frag from './waffle.frag.glsl?raw';

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

export interface HeroState {
  pour: number;
  scroll: number;
}

/**
 * Renders the waffle macro into one canvas. Owns its own loop and pauses itself
 * when the hero is off screen or the tab is hidden. Resolution adapts to frame time.
 */
export class WaffleRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly state: HeroState = { pour: 0, scroll: 0 };
  private gl: WebGL2RenderingContext;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private quality: number;
  private steps: number;
  private visible = true;
  private raf = 0;
  private start = performance.now();
  private frames: number[] = [];
  private still: boolean;

  constructor(canvas: HTMLCanvasElement, opts: { still: boolean }) {
    this.canvas = canvas;
    this.still = opts.still;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('webgl2 unavailable');
    this.gl = gl;

    const coarse = matchMedia('(pointer: coarse)').matches;
    this.quality = coarse ? 0.62 : 0.8;
    this.steps = coarse ? 70 : 110;

    const prog = gl.createProgram()!;
    for (const [type, src] of [
      [gl.VERTEX_SHADER, VERT],
      [gl.FRAGMENT_SHADER, frag],
    ] as const) {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
      gl.attachShader(prog, sh);
    }
    gl.bindAttribLocation(prog, 0, 'aPos');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
    gl.useProgram(prog);
    for (const n of ['uRes', 'uTime', 'uPour', 'uLight', 'uScroll', 'uPortrait', 'uSteps']) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.resize();
    addEventListener('resize', () => this.resize());
    addEventListener('pointermove', (e) => {
      this.pointer.tx = (e.clientX / innerWidth) * 2 - 1;
      this.pointer.ty = -((e.clientY / innerHeight) * 2 - 1);
    });
    document.addEventListener('visibilitychange', () => this.kick());
    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.kick();
    }).observe(canvas);
  }

  private resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr * this.quality));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr * this.quality));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
    if (this.still) this.draw(performance.now());
  }

  /** Re-render once (still mode) or make sure the loop runs. */
  kick() {
    if (this.still) {
      this.draw(performance.now());
      return;
    }
    if (!this.raf && this.visible && !document.hidden) this.raf = requestAnimationFrame(this.loop);
  }

  private last = 0;

  private loop = (now: number) => {
    this.raf = 0;
    if (!this.visible || document.hidden) return;
    // once the chocolate has landed only light and steam move: 30fps is plenty
    const settled = this.state.pour >= 1;
    if (!settled || now - this.last > 31) {
      this.last = now;
      this.draw(now);
      if (!settled) this.adapt(now);
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  // drop resolution if we cannot hold ~45fps; never below half
  private adapt(now: number) {
    this.frames.push(now);
    if (this.frames.length < 40) return;
    const avg = (this.frames[this.frames.length - 1] - this.frames[0]) / (this.frames.length - 1);
    this.frames.length = 0;
    if (avg > 22 && this.quality > 0.5) {
      this.quality = Math.max(0.5, this.quality - 0.1);
      this.steps = Math.max(56, this.steps - 14);
      this.resize();
    }
  }

  private draw(now: number) {
    const gl = this.gl;
    const p = this.pointer;
    p.x += (p.tx - p.x) * 0.04;
    p.y += (p.ty - p.y) * 0.04;
    const t = this.still ? 12 : (now - this.start) / 1000;
    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.uTime, t);
    gl.uniform1f(this.u.uPour, this.state.pour);
    gl.uniform2f(this.u.uLight, p.x, p.y);
    gl.uniform1f(this.u.uScroll, this.state.scroll);
    gl.uniform1f(this.u.uPortrait, this.canvas.clientHeight > this.canvas.clientWidth * 1.05 ? 1 : 0);
    gl.uniform1f(this.u.uSteps, this.steps);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
