import { Game } from './core/Game.js';
import { GameLoop } from './core/GameLoop.js';

/**
 * main.js - 應用程式與遊戲引擎啟動點
 */
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const autoBtn = document.getElementById('auto-btn');
    const audioInput = document.getElementById('audio-input');

    if (!canvas || !autoBtn || !audioInput) {
        console.error('遊戲必要 DOM 節點遺失，請檢查 index.html 配置。');
        return;
    }

    // 初始化遊戲主控制器
    const game = new Game(canvas, autoBtn, audioInput);

    // 啟動高精度循環器
    const gameLoop = new GameLoop(
        (dt) => game.update(dt),
        () => game.render()
    );

    gameLoop.start();
});
