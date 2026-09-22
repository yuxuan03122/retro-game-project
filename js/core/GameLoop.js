/**
 * GameLoop.js - 高精度 Delta Time 遊戲循環器
 */
export class GameLoop {
    constructor(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.isRunning = false;
        this.animationFrameId = null;

        this.loop = this.loop.bind(this);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        // 計算 delta time（秒為單位）
        let dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // 限制最大 dt (防止分頁閒置切換回來時的時間突波)
        if (dt > 0.1) dt = 0.1;

        if (this.updateFn) {
            this.updateFn(dt);
        }

        if (this.renderFn) {
            this.renderFn();
        }

        this.animationFrameId = requestAnimationFrame(this.loop);
    }
}
