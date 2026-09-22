import { TARGET_Y, HIT_WINDOWS } from '../config.js';

/**
 * Physics.js - 節奏遊戲打擊碰撞與距離空間判定系統
 */
export class Physics {
    /**
     * 檢測玩家在特定軌道按下時的打擊判定
     * @param {number} player 玩家編號 1 或 2
     * @param {number} laneId 軌道編號 0 ~ 3
     * @param {Array} notes 當前場景音符列表
     * @param {Object} currentDiff 當前難度參數 (hpGain, hpLoss, ...)
     * @param {Object} handlers 命中與失誤回調處理
     */
    static checkHit(player, laneId, notes, currentDiff, handlers) {
        // 篩選該玩家該軌道且處於活躍未被長按中的音符
        const laneNotes = notes.filter(n => 
            n.player === player && 
            n.laneId === laneId && 
            n.active && 
            !n.isHolding
        );

        if (laneNotes.length === 0) {
            // 空打懲罰
            if (handlers.onEmptyHit) {
                handlers.onEmptyHit(player);
            }
            return;
        }

        const closestNote = laneNotes[0];
        const distance = Math.abs(closestNote.y - TARGET_Y);

        if (distance < HIT_WINDOWS.PERFECT) {
            closestNote.active = false;
            closestNote.isFinished = true;
            if (handlers.onHitSuccess) {
                handlers.onHitSuccess(player, laneId, "PERFECT!", 100, currentDiff.hpGain, "#00ccff");
            }
        } else if (distance < HIT_WINDOWS.GOOD) {
            closestNote.active = false;
            closestNote.isFinished = true;
            if (handlers.onHitSuccess) {
                handlers.onHitSuccess(player, laneId, "GOOD", 50, Math.floor(currentDiff.hpGain / 2), "#ffcc00");
            }
        } else if (distance < HIT_WINDOWS.MISS) {
            closestNote.active = false;
            closestNote.isFinished = true;
            if (handlers.onMiss) {
                handlers.onMiss(player);
            }
        }
    }
}
