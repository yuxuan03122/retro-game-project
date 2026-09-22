import { Entity } from './Entity.js';
import { TARGET_Y, LANES_TEMPLATE, getLaneX } from '../config.js';

/**
 * Note.js - 音符實體，包含 Click 點擊音符與 Hold 長按音符
 */
export class Note extends Entity {
    constructor(player, laneId, type = 'click', holdLength = 0, initialSpeed = 5.5) {
        super(0, -40);
        this.player = player;
        this.laneId = laneId;
        this.type = type;
        this.holdLength = holdLength;
        this.speed = initialSpeed;
        this.active = true;
        this.isHolding = false;
        this.isFinished = false;
    }

    /**
     * 更新音符位置與長按判定
     */
    update(dt, userSpeed, gameMode, autoPlay, currentDiff, handlers) {
        const factor = dt * 60; // 基準化為 60fps 運動
        this.speed = userSpeed;
        this.x = getLaneX(this.player, this.laneId, gameMode);
        this.y += this.speed * factor;

        // AUTO 打擊模式判定
        if (autoPlay && this.active && !this.isHolding) {
            if (Math.abs(this.y - TARGET_Y) <= (this.speed * factor) / 2 || Math.abs(this.y - TARGET_Y) <= this.speed / 2) {
                if (this.type === 'click') {
                    this.active = false;
                    this.isFinished = true;
                    if (handlers.onHitSuccess) {
                        handlers.onHitSuccess(this.player, this.laneId, "AUTO!", 100, currentDiff.hpGain, "#00ccff");
                    }
                } else {
                    this.isHolding = true;
                    if (handlers.onHitSuccess) {
                        handlers.onHitSuccess(this.player, this.laneId, "AUTO HOLD!", 50, 2, "#00ccff");
                    }
                }
            }
        }

        // 長按 Hold 音符維持處理
        if (this.isHolding) {
            if (handlers.onHoldTick) {
                handlers.onHoldTick(this.player, this.laneId, this.x, TARGET_Y);
            }

            const tailY = this.y - this.holdLength;
            if (tailY >= TARGET_Y) {
                this.isHolding = false;
                this.isFinished = true;
                this.active = false;
                if (handlers.onHoldClear) {
                    handlers.onHoldClear(this.player, this.laneId, currentDiff.hpGain);
                }
            }
        }

        // Miss 超過判定線處理
        const checkY = (this.type === 'hold') ? (this.y - this.holdLength) : this.y;
        if (checkY > TARGET_Y + 60 && this.active && !this.isHolding) {
            this.active = false;
            this.isFinished = true;
            if (handlers.onMiss) {
                handlers.onMiss(this.player);
            }
        }
    }

    /**
     * 繪製音符與長條尾巴
     */
    draw(ctx, gameMode) {
        if (!this.active && !this.isHolding) return;
        const template = LANES_TEMPLATE[this.laneId];
        this.x = getLaneX(this.player, this.laneId, gameMode);

        if (this.type === 'hold') {
            const bodyY = this.y - this.holdLength;
            const bodyHeight = this.holdLength;
            const holdX = this.x - 14;

            ctx.save();
            ctx.fillStyle = this.isHolding ? `rgba(0, 204, 255, 0.8)` : `rgba(${template.rgb}, 0.5)`;
            ctx.fillRect(holdX, bodyY, 28, bodyHeight);
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(holdX, bodyY, 28, bodyHeight);
            ctx.restore();
        }

        Note.drawArrow(ctx, this.x, this.y, this.laneId, template.color, false);
    }

    /**
     * 箭頭形狀繪製靜態工具
     */
    static drawArrow(ctx, x, y, laneId, color, isOutline, isPressed = false) {
        ctx.save();
        ctx.translate(x, y);
        if (laneId === 0) ctx.rotate(Math.PI);       
        if (laneId === 1) ctx.rotate(Math.PI / 2);   
        if (laneId === 2) ctx.rotate(-Math.PI / 2);  
        if (laneId === 3) ctx.rotate(0);              

        ctx.beginPath();
        ctx.moveTo(-18, -12); ctx.lineTo(4, -12); ctx.lineTo(4, -24);
        ctx.lineTo(26, 0);    ctx.lineTo(4, 24);  ctx.lineTo(4, 12);
        ctx.lineTo(-18, 12);  ctx.closePath();

        if (isOutline) {
            ctx.strokeStyle = isPressed ? color : 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = isPressed ? 4 : 2;
            if (isPressed) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = color;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fill();
            }
            ctx.stroke();
        } else {
            ctx.fillStyle = color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.fill();
        }
        ctx.restore();
    }
}
