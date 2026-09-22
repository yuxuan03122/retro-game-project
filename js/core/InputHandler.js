import { LANES_TEMPLATE } from '../config.js';

/**
 * InputHandler.js - 集中管理鍵盤、滑鼠點擊與 UI 互動事件
 */
export class InputHandler {
    constructor(game, canvas, autoBtn, audioInput) {
        this.game = game;
        this.canvas = canvas;
        this.autoBtn = autoBtn;
        this.audioInput = audioInput;

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onCanvasClick = this.onCanvasClick.bind(this);
        this.onAutoBtnClick = this.onAutoBtnClick.bind(this);
        this.onAudioInputChange = this.onAudioInputChange.bind(this);
    }

    init() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        this.canvas.addEventListener('click', this.onCanvasClick);
        this.autoBtn.addEventListener('click', this.onAutoBtnClick);
        this.audioInput.addEventListener('change', this.onAudioInputChange);
    }

    destroy() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        this.canvas.removeEventListener('click', this.onCanvasClick);
        this.autoBtn.removeEventListener('click', this.onAutoBtnClick);
        this.audioInput.removeEventListener('change', this.onAudioInputChange);
    }

    onAutoBtnClick() {
        this.game.toggleAutoPlay();
    }

    onCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        if (this.game.gameState === 'MENU' && clickY > 440 && clickY < 490) {
            this.audioInput.click();
        }
    }

    onAudioInputChange(e) {
        const file = e.target.files[0];
        if (file) {
            this.game.audioSystem.loadAudioFile(file);
        }
    }

    onKeyDown(e) {
        // 喚醒 Web Audio API
        this.game.audioSystem.ensureContext();

        // 切換 AUTO 模式
        if (e.key === 'Tab') {
            e.preventDefault();
            this.game.toggleAutoPlay();
            return;
        }

        // 暫停 / 恢復
        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
            if (this.game.gameState === 'PLAYING') {
                this.game.pause();
                e.preventDefault();
                return;
            } else if (this.game.gameState === 'PAUSED') {
                this.game.resume();
                e.preventDefault();
                return;
            }
        }

        // 暫停選單操作
        if (this.game.gameState === 'PAUSED') {
            if (e.key.toLowerCase() === 'r') {
                this.game.startNewGame();
                e.preventDefault();
                return;
            }
            if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
                this.game.pauseFocus = (this.game.pauseFocus - 1 + 5) % 5;
            }
            if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
                this.game.pauseFocus = (this.game.pauseFocus + 1) % 5;
            }
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                this.game.adjustPauseOption(-1);
            }
            if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                this.game.adjustPauseOption(1);
            }
            if (e.code === 'Space' || e.key === 'Enter') {
                this.game.confirmPauseOption();
                e.preventDefault();
            }
            return;
        }

        // 主選單操作
        if (this.game.gameState === 'MENU') {
            if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
                this.game.menuFocus = (this.game.menuFocus - 1 + 4) % 4;
            }
            if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
                this.game.menuFocus = (this.game.menuFocus + 1) % 4;
            }
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                this.game.adjustMenuOption(-1);
            }
            if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                this.game.adjustMenuOption(1);
            }
            if (e.code === 'Space' || e.key === 'Enter') {
                this.game.startNewGame();
                e.preventDefault();
            }
            return;
        }

        // Game Over 結算畫面重試
        if (this.game.gameState === 'GAMEOVER') {
            if (e.code === 'Space' || e.key === 'Enter') {
                this.game.startNewGame();
                e.preventDefault();
            }
            return;
        }

        // 遊戲進行中打擊鍵盤處理
        if (this.game.gameState === 'PLAYING' && !this.game.autoPlay) {
            const key = e.key.toLowerCase();

            // P1 WASD 打擊
            for (let i = 0; i < LANES_TEMPLATE.length; i++) {
                if (key === LANES_TEMPLATE[i].keyP1) {
                    if (!this.game.player1.keysPressed[i]) {
                        this.game.player1.setKeyPressed(i, true);
                        this.game.handleHit(1, i);
                    }
                }
            }

            if (this.game.gameMode === '1P') {
                // 1P 模式下，方向鍵亦可打擊 P1
                for (let i = 0; i < LANES_TEMPLATE.length; i++) {
                    if (e.key === LANES_TEMPLATE[i].keyP2) {
                        if (!this.game.player1.keysPressed[i]) {
                            this.game.player1.setKeyPressed(i, true);
                            this.game.handleHit(1, i);
                        }
                    }
                }
            } else {
                // 2P 模式下，方向鍵控制 P2
                for (let i = 0; i < LANES_TEMPLATE.length; i++) {
                    if (e.key === LANES_TEMPLATE[i].keyP2) {
                        if (!this.game.player2.keysPressed[i]) {
                            this.game.player2.setKeyPressed(i, true);
                            this.game.handleHit(2, i);
                        }
                    }
                }
            }
        }
    }

    onKeyUp(e) {
        if (this.game.autoPlay) return;
        const key = e.key.toLowerCase();

        for (let i = 0; i < LANES_TEMPLATE.length; i++) {
            if (key === LANES_TEMPLATE[i].keyP1) {
                this.game.player1.setKeyPressed(i, false);
            }
            if (e.key === LANES_TEMPLATE[i].keyP2) {
                if (this.game.gameMode === '1P') {
                    this.game.player1.setKeyPressed(i, false);
                } else {
                    this.game.player2.setKeyPressed(i, false);
                }
            }
        }
    }
}
