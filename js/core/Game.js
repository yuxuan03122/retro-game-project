import { 
    CANVAS_WIDTH, 
    CANVAS_HEIGHT, 
    TARGET_Y, 
    GAME_STATES, 
    GAME_MODES, 
    TRACK_MODES, 
    DIFF_OPTIONS, 
    DIFFICULTIES, 
    LANES_TEMPLATE, 
    DEFAULT_SPEED, 
    MIN_SPEED, 
    MAX_SPEED, 
    SPEED_STEP, 
    HIGH_SCORE_KEY, 
    getLaneX 
} from '../config.js';
import { Player } from '../entities/Player.js';
import { Note } from '../entities/Note.js';
import { EnemyManager } from '../entities/EnemyManager.js';
import { Physics } from '../systems/Physics.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { HUD } from '../ui/HUD.js';
import { InputHandler } from './InputHandler.js';

/**
 * Game.js - 核心協調者與遊戲狀態控制器
 */
export class Game {
    constructor(canvas, autoBtn, audioInput) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.autoBtn = autoBtn;
        this.audioInput = audioInput;

        this.gameState = GAME_STATES.MENU;
        this.gameMode = '1P';
        this.menuFocus = 0;
        this.pauseFocus = 0;

        this.trackModeIndex = 0;
        this.diffIndex = 0; // 預設 EASY
        this.userSpeed = DEFAULT_SPEED;
        this.autoPlay = false;

        this.highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
        this.winnerText = "";

        this.player1 = new Player(1);
        this.player2 = new Player(2);

        this.enemyManager = new EnemyManager();
        this.particleSystem = new ParticleSystem();
        this.audioSystem = new AudioSystem();
        this.inputHandler = new InputHandler(this, canvas, autoBtn, audioInput);

        this.init();
    }

    get notes() {
        return this.enemyManager.getNotes();
    }
    set notes(val) {
        this.enemyManager.notes = val;
    }

    init() {
        this.inputHandler.init();
    }

    toggleAutoPlay() {
        this.autoPlay = !this.autoPlay;
        if (this.autoPlay) {
            this.autoBtn.innerText = "AUTO: ON (Tab)";
            this.autoBtn.classList.add('active');
        } else {
            this.autoBtn.innerText = "AUTO: OFF (Tab)";
            this.autoBtn.classList.remove('active');
        }
    }

    adjustMenuOption(dir) {
        if (this.menuFocus === 0) {
            this.trackModeIndex = (this.trackModeIndex + dir + TRACK_MODES.length) % TRACK_MODES.length;
        } else if (this.menuFocus === 1) {
            this.gameMode = this.gameMode === '1P' ? '2P' : '1P';
        } else if (this.menuFocus === 2) {
            this.diffIndex = (this.diffIndex + dir + DIFF_OPTIONS.length) % DIFF_OPTIONS.length;
        } else if (this.menuFocus === 3) {
            const newSpeed = this.userSpeed + dir * SPEED_STEP;
            this.userSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, parseFloat(newSpeed.toFixed(1))));
        }
    }

    adjustPauseOption(dir) {
        if (this.pauseFocus === 0) {
            this.gameMode = this.gameMode === '1P' ? '2P' : '1P';
        } else if (this.pauseFocus === 1) {
            this.diffIndex = (this.diffIndex + dir + DIFF_OPTIONS.length) % DIFF_OPTIONS.length;
        } else if (this.pauseFocus === 2) {
            const newSpeed = this.userSpeed + dir * SPEED_STEP;
            this.userSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, parseFloat(newSpeed.toFixed(1))));
        }
    }

    confirmPauseOption() {
        if (this.pauseFocus <= 2) {
            this.resume();
        } else if (this.pauseFocus === 3) {
            this.startNewGame();
        } else if (this.pauseFocus === 4) {
            this.gameState = GAME_STATES.MENU;
            this.audioSystem.stopBGM();
        }
    }

    startNewGame() {
        this.gameState = GAME_STATES.PLAYING;
        this.player1.reset();
        this.player2.reset();
        this.notes = [];
        this.particleSystem.clear();
        this.audioSystem.reset();

        const currentDiff = DIFFICULTIES[DIFF_OPTIONS[this.diffIndex]];
        this.audioSystem.startBGM(
            TRACK_MODES[this.trackModeIndex],
            currentDiff,
            (lane, type, holdLen) => this.spawnNote(lane, type, holdLen),
            true
        );
    }

    pause() {
        this.gameState = GAME_STATES.PAUSED;
        this.audioSystem.stopBGM();
    }

    resume() {
        this.gameState = GAME_STATES.PLAYING;
        const currentDiff = DIFFICULTIES[DIFF_OPTIONS[this.diffIndex]];
        this.audioSystem.startBGM(
            TRACK_MODES[this.trackModeIndex],
            currentDiff,
            (lane, type, holdLen) => this.spawnNote(lane, type, holdLen),
            false // 不重置播放進度
        );
    }

    spawnNote(lane, type = 'click', holdLen = 0) {
        this.notes.push(new Note(1, lane, type, holdLen, this.userSpeed));
        if (this.gameMode === '2P') {
            this.notes.push(new Note(2, lane, type, holdLen, this.userSpeed));
        }
    }

    handleHit(playerNum, laneId) {
        if (this.gameState !== GAME_STATES.PLAYING || this.autoPlay) return;

        const currentDiff = DIFFICULTIES[DIFF_OPTIONS[this.diffIndex]];
        Physics.checkHit(playerNum, laneId, this.notes, currentDiff, {
            onHitSuccess: (player, lane, label, addScore, addHp, color) => {
                this.onHitSuccess(player, lane, label, addScore, addHp, color);
            },
            onMiss: (player) => {
                this.onMiss(player);
            },
            onEmptyHit: (playerNum) => {
                const targetPlayer = playerNum === 1 ? this.player1 : this.player2;
                targetPlayer.takeDamage(1);
                this.checkGameOver();
            }
        });
    }

    onHitSuccess(playerNum, laneId, label, addScore, addHp, color) {
        const player = playerNum === 1 ? this.player1 : this.player2;
        player.applyHitSuccess(laneId, label, addScore, addHp, color);

        const xPos = getLaneX(playerNum, laneId, this.gameMode);
        this.particleSystem.createExplosion(xPos, TARGET_Y, LANES_TEMPLATE[laneId].color);
        HUD.triggerShake(2, 4);

        const isGoodOrPerfect = label.includes('PERFECT') || label.includes('AUTO');
        this.audioSystem.playHitSound(isGoodOrPerfect ? 'PERFECT' : 'GOOD');
    }

    onMiss(playerNum) {
        const currentDiff = DIFFICULTIES[DIFF_OPTIONS[this.diffIndex]];
        const player = playerNum === 1 ? this.player1 : this.player2;

        this.audioSystem.playHitSound('MISS');
        HUD.triggerShake(7, 10);
        player.applyMiss(currentDiff.hpLoss);
        this.checkGameOver();
    }

    checkGameOver() {
        if (this.gameMode === '1P') {
            if (!this.player1.isAlive()) {
                this.player1.health = 0;
                this.gameState = GAME_STATES.GAMEOVER;
                this.winnerText = "GAME OVER";
                this.audioSystem.stopBGM();
                if (this.player1.score > this.highScore) {
                    this.highScore = this.player1.score;
                    localStorage.setItem(HIGH_SCORE_KEY, this.highScore.toString());
                }
            }
        } else {
            if (!this.player1.isAlive() || !this.player2.isAlive()) {
                this.gameState = GAME_STATES.GAMEOVER;
                this.audioSystem.stopBGM();
                if (!this.player1.isAlive() && !this.player2.isAlive()) {
                    this.winnerText = "DRAW!";
                } else if (!this.player1.isAlive()) {
                    this.winnerText = "PLAYER 2 WINS!";
                } else {
                    this.winnerText = "PLAYER 1 WINS!";
                }
            }
        }
    }

    update(dt) {
        // 更新玩家狀態（殘光、判定字計時）
        this.player1.update(dt);
        if (this.gameMode === '2P') {
            this.player2.update(dt);
        }

        if (this.gameState === GAME_STATES.PLAYING) {
            const currentDiff = DIFFICULTIES[DIFF_OPTIONS[this.diffIndex]];

            // 音訊分析即時生成音符
            if (TRACK_MODES[this.trackModeIndex] === 'CUSTOM MP3') {
                this.audioSystem.updateCustomAudioNotes(currentDiff, (lane, type, holdLen) => {
                    this.spawnNote(lane, type, holdLen);
                });
            }

            // 更新音符
            this.notes.forEach(note => {
                note.update(dt, this.userSpeed, this.gameMode, this.autoPlay, currentDiff, {
                    onHitSuccess: (player, lane, label, addScore, addHp, color) => {
                        this.onHitSuccess(player, lane, label, addScore, addHp, color);
                    },
                    onHoldTick: (playerNum, lane, x, y) => {
                        const player = playerNum === 1 ? this.player1 : this.player2;
                        player.applyHoldTick(lane, 2);
                        if (Math.random() < 0.4) {
                            this.particleSystem.spawn(x, y, LANES_TEMPLATE[lane].color);
                        }
                    },
                    onHoldClear: (playerNum, lane, hpGain) => {
                        const player = playerNum === 1 ? this.player1 : this.player2;
                        player.setKeyPressed(lane, false);
                        this.onHitSuccess(playerNum, lane, "HOLD CLEAR!", 150, hpGain, "#00ccff");
                    },
                    onMiss: (playerNum) => {
                        this.onMiss(playerNum);
                    }
                });
            });
            this.notes = this.notes.filter(note => !note.isFinished);

            // 更新粒子
            this.particleSystem.update(dt);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const shook = HUD.applyScreenShake(this.ctx);

        // 繪製軌道與基準線
        HUD.drawLanes(this.ctx, this.gameMode, this.player1, this.player2);
        HUD.drawCooldownMeter(this.ctx, this.audioSystem.spawnCooldown);

        // 繪製遊戲內容 (音符、粒子、HUD)
        if (this.gameState === GAME_STATES.PLAYING || this.gameState === GAME_STATES.PAUSED) {
            this.enemyManager.draw(this.ctx, this.gameMode);
            this.particleSystem.draw(this.ctx);
            HUD.drawPlayerHUD(this.ctx, this.player1, this.gameMode);
            if (this.gameMode === '2P') {
                HUD.drawPlayerHUD(this.ctx, this.player2, this.gameMode);
            }
        }

        HUD.restoreScreenShake(this.ctx, shook);

        // 繪製狀態層
        if (this.gameState === GAME_STATES.MENU) {
            HUD.drawMenuOverlay(
                this.ctx, 
                this.menuFocus, 
                this.trackModeIndex, 
                this.gameMode, 
                this.diffIndex, 
                this.userSpeed, 
                this.audioSystem.audioFileName
            );
        } else if (this.gameState === GAME_STATES.PAUSED) {
            HUD.drawPauseOverlay(
                this.ctx, 
                this.pauseFocus, 
                this.gameMode, 
                this.diffIndex, 
                this.userSpeed
            );
        } else if (this.gameState === GAME_STATES.GAMEOVER) {
            HUD.drawGameOverOverlay(
                this.ctx, 
                this.winnerText, 
                this.player1, 
                this.player2, 
                this.gameMode
            );
        }
    }
}
