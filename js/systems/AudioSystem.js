import { SONG_PATTERN_CLASSIC } from '../config.js';

/**
 * AudioSystem.js - 處理 Web Audio 即時合成、MP3 頻譜分析與 BGM 音符步進器
 */
export class AudioSystem {
    constructor() {
        this.audioCtx = null;
        this.analyser = null;
        this.audioSource = null;
        this.dataArray = null;

        this.bgmTimer = null;
        this.currentStep = 0;
        this.audioPlayer = new Audio();
        this.audioPlayer.crossOrigin = "anonymous";
        this.audioFileName = "未載入 MP3 (自動使用電子音效)";
        this.customAudioLoaded = false;
        this.spawnCooldown = 0;
        this.lastLane = -1;
    }

    /**
     * 確保 AudioContext 已初始化並處於 running 狀態
     */
    ensureContext() {
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    /**
     * 初始化 MP3 音頻頻率分析器
     */
    setupAudioAnalysis() {
        const ctx = this.ensureContext();
        if (!ctx) return;

        if (!this.analyser) {
            this.analyser = ctx.createAnalyser();
            this.analyser.fftSize = 128; // 分析 64 個頻段
            this.audioSource = ctx.createMediaElementSource(this.audioPlayer);
            this.audioSource.connect(this.analyser);
            this.analyser.connect(ctx.destination);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        }
    }

    /**
     * 載入使用者上傳的自訂 MP3 檔案
     */
    loadAudioFile(file) {
        if (!file) return;
        this.audioPlayer.src = URL.createObjectURL(file);
        this.audioFileName = file.name;
        this.customAudioLoaded = true;
        this.setupAudioAnalysis();
    }

    /**
     * 合成單純振盪器音調
     */
    playSoundTone(freq, type, duration, vol) {
        const ctx = this.ensureContext();
        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            // 忽略 AudioContext 在非使用者手勢下可能引發的短暫異常
        }
    }

    /**
     * 播放判定打擊回饋音效
     */
    playHitSound(quality) {
        if (quality === 'PERFECT') {
            this.playSoundTone(1046.50, 'sine', 0.08, 0.2);
        } else if (quality === 'GOOD') {
            this.playSoundTone(659.25, 'sine', 0.09, 0.15);
        } else if (quality === 'MISS') {
            this.playSoundTone(110, 'sawtooth', 0.15, 0.2);
        }
    }

    /**
     * 實時頻率分析對拍邏輯（於每幀 Update 中調用）
     */
    updateCustomAudioNotes(currentDiff, onSpawn) {
        if (this.spawnCooldown > 0) {
            this.spawnCooldown--;
            return;
        }

        if (this.customAudioLoaded && this.analyser) {
            this.analyser.getByteFrequencyData(this.dataArray);

            // 計算低頻 (重音/鼓點 0~7) 與中高頻 (人聲/旋律 16~39)
            let bassEnergy = 0;
            for (let i = 0; i < 8; i++) bassEnergy += this.dataArray[i];
            bassEnergy /= 8;

            let trebleEnergy = 0;
            for (let i = 16; i < 40; i++) trebleEnergy += this.dataArray[i];
            trebleEnergy /= 24;

            const totalEnergy = (bassEnergy * 1.5 + trebleEnergy) / 2.5;
            const threshold = 110 * currentDiff.sensitivity;

            if (totalEnergy > threshold) {
                let lane = 0;
                if (bassEnergy > trebleEnergy + 20) {
                    lane = Math.random() < 0.5 ? 0 : 1; // 低音降在左側軌道
                } else {
                    lane = Math.random() < 0.5 ? 2 : 3; // 高音降在右側軌道
                }

                if (lane === this.lastLane && Math.random() < 0.6) {
                    lane = (lane + 1 + Math.floor(Math.random() * 3)) % 4;
                }
                this.lastLane = lane;

                const isHold = Math.random() < 0.15; // 降低長按機率
                const holdLen = isHold ? Math.floor(Math.random() * 60 + 60) : 0;

                onSpawn(lane, isHold ? 'hold' : 'click', holdLen);
                this.spawnCooldown = currentDiff.cooldown;
            }
        } else {
            // 未載入 MP3 時使用輕快節奏自動模擬
            if (Math.random() < 0.05) {
                const lane = Math.floor(Math.random() * 4);
                onSpawn(lane, 'click', 0);
                this.spawnCooldown = currentDiff.cooldown;
            }
        }
    }

    /**
     * Classic 模式步進觸發器
     */
    triggerBgmStep(currentDiff, onSpawn) {
        const stepData = SONG_PATTERN_CLASSIC[this.currentStep % SONG_PATTERN_CLASSIC.length];

        if (!this.customAudioLoaded) {
            if (stepData.bass > 0) this.playSoundTone(stepData.bass, 'sawtooth', 0.2, 0.18);
            if (stepData.melody > 0) this.playSoundTone(stepData.melody, 'square', 0.15, 0.12);
        }

        if (stepData.lane !== -1) {
            if (!(currentDiff.name === 'EASY' && this.currentStep % 2 !== 0)) {
                const isHold = stepData.hold || false;
                const holdLen = stepData.len || 0;
                onSpawn(stepData.lane, isHold ? 'hold' : 'click', holdLen);
            }
        }
        this.currentStep++;
    }

    /**
     * 啟動背景音樂與步進計時器
     */
    startBGM(trackMode, currentDiff, onSpawn, resetPosition = true) {
        this.stopBGM();
        this.ensureContext();

        const stepTime = (60 / currentDiff.bpm / 4) * 1000;

        if (this.customAudioLoaded) {
            if (resetPosition) {
                this.audioPlayer.currentTime = 0;
            }
            this.audioPlayer.play().catch(() => {});
        }

        if (trackMode === 'CLASSIC') {
            this.bgmTimer = setInterval(() => {
                this.triggerBgmStep(currentDiff, onSpawn);
            }, stepTime);
        }
    }

    /**
     * 停止/暫停背景音樂
     */
    stopBGM() {
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
        if (this.customAudioLoaded) {
            this.audioPlayer.pause();
        }
    }

    reset() {
        this.currentStep = 0;
        this.spawnCooldown = 0;
        this.lastLane = -1;
    }
}
