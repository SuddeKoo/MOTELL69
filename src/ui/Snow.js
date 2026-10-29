// Lett snøfall på canvas. Kjøres bare når laget er synlig (meny eller aktuell kameravinkel).
export class Snow {
  constructor(canvas, { count = 90, speed = 1, wind = 0.35, size = 1, alpha = 0.8 } = {}) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.o = { count, speed, wind, size, alpha };
    this.gust = 0;
    this.flakes = [];
    this.resize();
    for (let i = 0; i < count; i++) this.flakes.push(this.make(true));
  }
  resize() {
    this.w = this.c.width = this.c.clientWidth || this.c.width;
    this.h = this.c.height = this.c.clientHeight || this.c.height;
  }
  make(any) {
    const z = Math.random();
    return { x: Math.random() * (this.w + 100) - 50, y: any ? Math.random() * this.h : -10, z, r: (0.7 + z * 2.2) * this.o.size, vy: (18 + z * 50) * this.o.speed, ph: Math.random() * 6.28 };
  }
  step(dt) {
    const { ctx, w, h } = this;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    this.gust *= Math.pow(0.4, dt);
    const wind = (this.o.wind + this.gust) * 60;
    ctx.fillStyle = '#e8eef5';
    for (const f of this.flakes) {
      f.ph += dt * (1 + f.z);
      f.y += f.vy * dt;
      f.x += (wind * (0.4 + f.z) + Math.sin(f.ph) * 12) * dt;
      if (f.y > h + 6 || f.x > w + 60 || f.x < -60) Object.assign(f, this.make(false), f.x > w + 60 ? { x: -40 } : {});
      ctx.globalAlpha = this.o.alpha * (0.35 + f.z * 0.65);
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
