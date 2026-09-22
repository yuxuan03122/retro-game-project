/**
 * config.js - 集中管理遊戲所有數值、難度、軌道、音頻與常數設定
 */

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 720;
export const TARGET_Y = 610;

export const MAX_HEALTH = 100;
export const DEFAULT_SPEED = 5.5;
export const MIN_SPEED = 3.0;
export const MAX_SPEED = 12.0;
export const SPEED_STEP = 0.5;

export const HIGH_SCORE_KEY = 'rhythm_game_highscore';

export const GAME_STATES = Object.freeze({
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER'
});

export const GAME_MODES = ['1P', '2P'];
export const TRACK_MODES = ['CLASSIC', 'CUSTOM MP3'];
export const DIFF_OPTIONS = ['EASY', 'NORMAL', 'HARD'];

export const DIFFICULTIES = Object.freeze({
    EASY:   { name: 'EASY',   bpm: 100, hpLoss: 3, hpGain: 6, sensitivity: 1.4, cooldown: 18 },
    NORMAL: { name: 'NORMAL', bpm: 120, hpLoss: 5, hpGain: 5, sensitivity: 1.25, cooldown: 12 },
    HARD:   { name: 'HARD',   bpm: 130, hpLoss: 8, hpGain: 4, sensitivity: 1.1, cooldown: 8 }
});

export const HIT_WINDOWS = Object.freeze({
    PERFECT: 45,
    GOOD: 85,
    MISS: 110
});

export const LANES_TEMPLATE = [
    { id: 0, keyP1: 'a', keyP2: 'ArrowLeft',  color: '#ff0055', rgb: '255, 0, 85',   glowColor: 'rgba(255,0,85,',   label: '←' },
    { id: 1, keyP1: 's', keyP2: 'ArrowDown',  color: '#00ccff', rgb: '0, 204, 255', glowColor: 'rgba(0,204,255,',  label: '↓' },
    { id: 2, keyP1: 'w', keyP2: 'ArrowUp',    color: '#ffcc00', rgb: '255, 204, 0',  glowColor: 'rgba(255,204,0,',  label: '↑' },
    { id: 3, keyP1: 'd', keyP2: 'ArrowRight', color: '#a000ff', rgb: '160, 0, 255', glowColor: 'rgba(160,0,255,', label: '→' }
];

/**
 * 依據玩家與遊戲模式計算各軌道 X 軸中心座標
 */
export function getLaneX(player, laneId, gameMode) {
    return gameMode === '1P'
        ? (280 + laneId * 113)
        : (player === 1 ? (70 + laneId * 90) : (560 + laneId * 90));
}

export const NOTES_FREQ = {
    E3: 164.81, G3: 196.00, A3: 220.00, B3: 246.94, C4: 261.63,
    D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392.00,
    E2: 82.41,  C2: 65.41,  D2: 73.42,   G2: 98.00
};

export const SONG_PATTERN_CLASSIC = [
    { kick: true,  snare: false, hihat: true,  bass: NOTES_FREQ.E2, melody: NOTES_FREQ.E4,  lane: 0 },
    { kick: false, snare: false, hihat: false, bass: 0,             melody: 0,              lane: -1 },
    { kick: false, snare: false, hihat: true,  bass: 0,             melody: NOTES_FREQ.G4,  lane: 1 },
    { kick: false, snare: false, hihat: false, bass: 0,             melody: 0,              lane: -1 },
    { kick: false, snare: true,  hihat: true,  bass: NOTES_FREQ.E2, melody: NOTES_FREQ.Fs4, lane: 2 },
    { kick: false, snare: false, hihat: false, bass: 0,             melody: 0,              lane: -1 },
    { kick: true,  snare: false, hihat: true,  bass: 0,             melody: NOTES_FREQ.E4,  lane: 3 },
    { kick: false, snare: false, hihat: false, bass: 0,             melody: 0,              lane: -1 },

    { kick: true,  snare: false, hihat: true,  bass: NOTES_FREQ.C2, melody: NOTES_FREQ.B3,  lane: 1 },
    { kick: false, snare: false, hihat: false, bass: 0,             melody: 0,              lane: -1 },
    { kick: false, snare: false, hihat: true,  bass: 0,             melody: NOTES_FREQ.C4,  lane: 0 },
    { kick: false, snare: false, hihat: false, bass: 0,             melody: 0,              lane: -1 },
    { kick: false, snare: true,  hihat: true,  bass: NOTES_FREQ.C2, melody: NOTES_FREQ.D4,  lane: 2 },
    { kick: true,  snare: false, hihat: false, bass: 0,             melody: 0,              lane: -1 },
    { kick: false, snare: false, hihat: true,  bass: 0,             melody: NOTES_FREQ.B3,  lane: 3 },
    { kick: false, snare: false, hihat: false, bass: 0,             melody: 0,              lane: -1 }
];
