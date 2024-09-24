export default class Score {
  constructor(ctx, scaleRatio) {
    this.ctx = ctx;
    this.scaleRatio = scaleRatio;
    this.score = 0;
    this.highScore = 0;
    this.totalScore = 0;
    this.scoreElement = document.getElementById('score');
    this.balanceElement = document.getElementById('balance');
  }

  update(deltaTime) {
    this.score += deltaTime * 0.01;
    this.scoreElement.innerText = `Score: ${Math.floor(this.score)}`;
  }

  draw() {
    const fontSize = 20 * this.scaleRatio;
    this.ctx.font = `${fontSize}px Verdana`;
    this.ctx.fillStyle = "white";
    this.ctx.fillText(`High Score: ${Math.floor(this.highScore)}`, this.ctx.canvas.width - 300, 30);
  }

  reset() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    this.totalScore += this.score;
    this.balanceElement.innerText = `${Math.floor(this.totalScore)} Gr`;
    this.score = 0;
    this.scoreElement.innerText = `Score: ${Math.floor(this.score)}`;
  }

  setHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }

  getTotalScore() {
    return Math.floor(this.totalScore);
  }
}
