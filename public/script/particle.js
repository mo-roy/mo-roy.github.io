// src/utils/particle.js

export default class Particle {
  constructor(x, y, vx, vy, radius, color, canvasWidth, canvasHeight) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.color = color;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Wrap particles around the edges
    if (this.x < 0) this.x = this.canvasWidth;
    if (this.x > this.canvasWidth) this.x = 0;
    if (this.y < 0) this.y = this.canvasHeight;
    if (this.y > this.canvasHeight) this.y = 0;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
