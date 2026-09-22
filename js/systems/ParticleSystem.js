/**
 * ParticleSystem.js - 打擊爆炸特效與音符長按粒子系統
 */
export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.radius = Math.random() * 3 + 1;
        this.alpha = 1;
        this.decay = Math.random() * 0.04 + 0.02;
    }

    update(dt = 1/60) {
        const factor = dt * 60;
        this.x += this.vx * factor;
        this.y += this.vy * factor;
        this.alpha -= this.decay * factor;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    /**
     * 生成打擊爆炸粒子群
     */
    createExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    /**
     * 生成單個粒子 (用於 Hold 拖尾)
     */
    spawn(x, y, color) {
        this.particles.push(new Particle(x, y, color));
    }

    update(dt) {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update(dt);
        }
        this.particles = this.particles.filter(p => p.alpha > 0);
    }

    draw(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].draw(ctx);
        }
    }

    clear() {
        this.particles = [];
    }
}
