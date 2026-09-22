/**
 * Entity.js - 所有遊戲實體基類
 */
export class Entity {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.active = true;
    }

    /**
     * 更新實體邏輯
     * @param {number} dt Delta time (秒或幀進度)
     */
    update(dt) {
        // 由子類別覆寫
    }

    /**
     * 繪製實體
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        // 由子類別覆寫
    }

    destroy() {
        this.active = false;
    }
}
