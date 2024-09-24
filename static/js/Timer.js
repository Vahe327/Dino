export default class Timer {
  constructor(ctx, scaleRatio) {
    this.ctx = ctx;
    this.scaleRatio = scaleRatio;
    this.time = 0;
    this.startTime = null;
  }

  start() {
    this.startTime = performance.now();
  }

  update(deltaTime) {
    if (this.startTime !== null) {
      this.time += deltaTime;
    }
  }

  reset() {
    this.time = 0;
    this.startTime = performance.now();
  }

  draw() {
    if (this.startTime !== null) {
      const seconds = Math.floor(this.time / 1000);
      const fontSize = 20 * this.scaleRatio;
      this.ctx.font = `${fontSize}px Verdana`;
      this.ctx.fillStyle = "white";
      this.ctx.fillText(`Time: ${seconds}s`, 10, 30);
    }
  }
}
