import { Entity } from './Entity.js';
import { MAX_HEALTH } from '../config.js';

/**
 * Player.js - 玩家狀態實體，管理分數、血量、連擊、按鍵與打擊文字狀態
 */
export class Player extends Entity {
    constructor(playerId = 1) {
        super();
        this.playerId = playerId;
        this.reset();
    }

    reset() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.health = MAX_HEALTH;
        this.keysPressed = [false, false, false, false];
        this.laneGlows = [0, 0, 0, 0];
        this.judgmentText = "";
        this.judgmentTimer = 0;
        this.judgmentColor = "#ffffff";
    }

    /**
     * 更新軌道殘光與判定文字計時
     * @param {number} dt 
     */
    update(dt) {
        const factor = dt * 60; // 基準化為 60fps 速率
        for (let i = 0; i < 4; i++) {
            if (this.laneGlows[i] > 0) {
                this.laneGlows[i] = Math.max(0, this.laneGlows[i] - 0.05 * factor);
            }
        }

        if (this.judgmentTimer > 0) {
            this.judgmentTimer -= 1 * factor;
            if (this.judgmentTimer <= 0) {
                this.judgmentTimer = 0;
                this.judgmentText = "";
            }
        }
    }

    /**
     * 擊中判定成功處理
     */
    applyHitSuccess(laneId, label, addScore, addHp, color) {
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        this.score += addScore + (Math.floor(this.combo / 10) * 10);
        this.health = Math.min(MAX_HEALTH, this.health + addHp);
        this.judgmentText = label;
        this.judgmentColor = color;
        this.judgmentTimer = 25;
        this.laneGlows[laneId] = 1.0;
    }

    /**
     * Miss 判定處理
     */
    applyMiss(hpLoss) {
        this.combo = 0;
        this.health -= hpLoss;
        this.judgmentText = "MISS";
        this.judgmentColor = "#ff0055";
        this.judgmentTimer = 25;
    }

    /**
     * Hold 音符持續累積得分
     */
    applyHoldTick(laneId, addScore = 2) {
        this.score += addScore;
        this.laneGlows[laneId] = 0.8;
        this.keysPressed[laneId] = true;
    }

    setKeyPressed(laneId, pressed) {
        if (laneId >= 0 && laneId < 4) {
            this.keysPressed[laneId] = pressed;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
    }

    isAlive() {
        return this.health > 0;
    }
}
