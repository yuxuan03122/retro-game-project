import { 
    CANVAS_WIDTH, 
    CANVAS_HEIGHT, 
    TARGET_Y, 
    MAX_HEALTH, 
    LANES_TEMPLATE, 
    getLaneX, 
    TRACK_MODES, 
    DIFF_OPTIONS 
} from '../config.js';
import { Note } from '../entities/Note.js';

/**
 * HUD.js - 負責所有 Canvas 2D 使用者介面、軌道、血條、選單、震屏與結算渲染
 */
export class HUD {
    static shakeTimer = 0;
    static shakeIntensity = 0;

    /**
     * 觸發螢幕震動 (Screen Shake)
     */
    static triggerShake(intensity = 6, duration = 8) {
        HUD.shakeIntensity = intensity;
        HUD.shakeTimer = duration;
    }

    /**
     * 套用螢幕震動轉換
     */
    static applyScreenShake(ctx) {
        if (HUD.shakeTimer > 0) {
            const dx = (Math.random() - 0.5) * HUD.shakeIntensity;
            const dy = (Math.random() - 0.5) * HUD.shakeIntensity;
            ctx.save();
            ctx.translate(dx, dy);
            HUD.shakeTimer--;
            return true;
        }
        return false;
    }

    /**
     * 恢復螢幕震動轉換
     */
    static restoreScreenShake(ctx, applied) {
        if (applied) {
            ctx.restore();
        }
    }

    /**
     * 繪製音符生成冷卻計量條 (Cooldown Meter)
     */
    static drawCooldownMeter(ctx, currentCooldown, maxCooldown = 18) {
        if (currentCooldown > 0) {
            const width = 80;
            const height = 4;
            const x = CANVAS_WIDTH / 2 - width / 2;
            const y = 8;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(x, y, width, height);
            ctx.fillStyle = '#00ccff';
            ctx.fillRect(x, y, (currentCooldown / maxCooldown) * width, height);
        }
    }

    /**
     * 繪製打擊基準線與各軌道
     */
    static drawLanes(ctx, gameMode, player1, player2) {
        // 繪製 1P 軌道
        for (let i = 0; i < 4; i++) {
            HUD.drawSingleLane(ctx, 1, i, gameMode, player1.keysPressed[i], player1.laneGlows[i]);
        }

        // 若為 2P 模式，繪製 2P 軌道
        if (gameMode === '2P' && player2) {
            for (let i = 0; i < 4; i++) {
                HUD.drawSingleLane(ctx, 2, i, gameMode, player2.keysPressed[i], player2.laneGlows[i]);
            }
        }

        // 繪製打擊水平基準線
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, TARGET_Y);
        ctx.lineTo(CANVAS_WIDTH, TARGET_Y);
        ctx.stroke();
    }

    /**
     * 繪製單一軌道背景光與按鍵提示
     */
    static drawSingleLane(ctx, player, i, gameMode, isPressed, glowAlpha) {
        const x = getLaneX(player, i, gameMode);
        const template = LANES_TEMPLATE[i];

        // 軌道擊中發光漸層
        if (glowAlpha > 0) {
            const grad = ctx.createLinearGradient(0, 0, 0, TARGET_Y);
            grad.addColorStop(0, `${template.glowColor}0)`);
            grad.addColorStop(1, `${template.glowColor}${glowAlpha * 0.4})`);
            ctx.fillStyle = grad;
            ctx.fillRect(x - 35, 0, 70, TARGET_Y);
        }

        // 判定圈/目標箭頭
        Note.drawArrow(ctx, x, TARGET_Y, i, template.color, true, isPressed);

        // 按鍵文字提示
        ctx.fillStyle = isPressed ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        const labelText = gameMode === '1P'
            ? `${template.keyP1.toUpperCase()}/${template.label}`
            : (player === 1 ? template.keyP1.toUpperCase() : template.label);
        ctx.fillText(labelText, x, TARGET_Y + 40);
    }

    /**
     * 繪製玩家數值 HUD (血量條、分數、Combo、判定文字)
     */
    static drawPlayerHUD(ctx, playerInstance, gameMode) {
        const isP1 = playerInstance.playerId === 1;
        const hp = playerInstance.health;
        const score = playerInstance.score;
        const combo = playerInstance.combo;
        const text = playerInstance.judgmentText;
        const color = playerInstance.judgmentColor;
        const xAnchor = gameMode === '1P' ? 280 : (isP1 ? 70 : 560);

        // 生命值條底槽
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(xAnchor - 30, 25, 400, 10);

        // 生命值條長度 (低於 30 變紅)
        ctx.fillStyle = hp > 30 ? '#00ccff' : '#ff0055';
        ctx.fillRect(xAnchor - 30, 25, Math.max(0, (hp / MAX_HEALTH) * 400), 10);

        // 得分文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(`P${playerInstance.playerId} SCORE: ${score}`, xAnchor - 30, 60);

        // 連擊 Combo 特效文字
        if (combo > 1) {
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 24px Courier New';
            ctx.fillText(`${combo} COMBO!`, xAnchor - 30, 90);
        }

        // 打擊判定評價 (PERFECT / GOOD / MISS)
        if (text) {
            ctx.save();
            ctx.fillStyle = color;
            ctx.font = 'bold 24px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(text, xAnchor + 170, TARGET_Y - 70);
            ctx.restore();
        }
    }

    /**
     * 主選單畫面覆蓋層
     */
    static drawMenuOverlay(ctx, menuFocus, trackModeIndex, gameMode, diffIndex, userSpeed, audioFileName) {
        ctx.fillStyle = 'rgba(8, 8, 13, 0.88)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ccff';
        ctx.font = 'bold 36px Courier New';
        ctx.fillText("RHYTHM GAME", CANVAS_WIDTH / 2, 120);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Courier New';
        ctx.fillText("Select Mode & Difficulty", CANVAS_WIDTH / 2, 160);

        const options = [
            `譜面: < ${TRACK_MODES[trackModeIndex]} >`,
            `模式: < ${gameMode} >`,
            `難度: < ${DIFF_OPTIONS[diffIndex]} >`,
            `速度: < ${userSpeed.toFixed(1)} >`
        ];

        options.forEach((opt, idx) => {
            ctx.fillStyle = menuFocus === idx ? '#ff0055' : '#a0a0b8';
            ctx.font = '20px Courier New';
            ctx.fillText(menuFocus === idx ? `> ${opt} <` : opt, CANVAS_WIDTH / 2, 240 + idx * 45);
        });

        // MP3 載入按鈕框
        ctx.fillStyle = 'rgba(0, 204, 255, 0.15)';
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 2;
        ctx.fillRect(CANVAS_WIDTH / 2 - 220, 440, 440, 45);
        ctx.strokeRect(CANVAS_WIDTH / 2 - 220, 440, 440, 45);

        ctx.fillStyle = '#ffffff';
        ctx.font = '13px Courier New';
        const displayFileName = audioFileName.length > 28 ? audioFileName.substring(0, 28) + '...' : audioFileName;
        ctx.fillText(`🎵 MP3 檔案: ${displayFileName}`, CANVAS_WIDTH / 2, 467);

        ctx.fillStyle = '#00ccff';
        ctx.font = '18px Courier New';
        ctx.fillText("按下 [ Space ] 或 [ Enter ] 開始遊戲", CANVAS_WIDTH / 2, 540);
    }

    /**
     * 暫停畫面覆蓋層
     */
    static drawPauseOverlay(ctx, pauseFocus, gameMode, diffIndex, userSpeed) {
        ctx.fillStyle = 'rgba(8, 8, 13, 0.88)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 36px Courier New';
        ctx.fillText("PAUSED", CANVAS_WIDTH / 2, 160);

        const options = [
            `模式: < ${gameMode} >`,
            `難度: < ${DIFF_OPTIONS[diffIndex]} >`,
            `速度: < ${userSpeed.toFixed(1)} >`,
            "繼續遊戲 (Resume)",
            "返回主選單 (Main Menu)"
        ];

        options.forEach((opt, idx) => {
            ctx.fillStyle = pauseFocus === idx ? '#00ccff' : '#a0a0b8';
            ctx.font = '20px Courier New';
            ctx.fillText(pauseFocus === idx ? `> ${opt} <` : opt, CANVAS_WIDTH / 2, 270 + idx * 45);
        });
    }

    /**
     * 遊戲結束 (Game Over) 結算覆蓋層
     */
    static drawGameOverOverlay(ctx, winnerText, player1, player2, gameMode) {
        ctx.fillStyle = 'rgba(8, 8, 13, 0.92)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 46px Courier New';
        ctx.fillText(winnerText, CANVAS_WIDTH / 2, 240);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Courier New';
        if (gameMode === '1P') {
            ctx.fillText(`最終得分: ${player1.score} | 最高 Combo: ${player1.maxCombo}`, CANVAS_WIDTH / 2, 320);
        } else {
            ctx.fillText(`P1 得分: ${player1.score} (Combo: ${player1.maxCombo})`, CANVAS_WIDTH / 2, 310);
            ctx.fillText(`P2 得分: ${player2.score} (Combo: ${player2.maxCombo})`, CANVAS_WIDTH / 2, 345);
        }

        ctx.fillStyle = '#00ccff';
        ctx.font = '18px Courier New';
        ctx.fillText("按下 [ Space ] 或 [ Enter ] 再試一次", CANVAS_WIDTH / 2, 460);
    }
}
