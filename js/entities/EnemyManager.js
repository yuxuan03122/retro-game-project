import { Note } from './Note.js';

/**
 * EnemyManager.js - 障礙物與音符群管理器 (Enemy / Note Manager)
 * 負責管理場景中所有下落音符之生成、生命週期更新、繪製與碰撞判定整合
 */
export class EnemyManager {
    constructor() {
        this.notes = [];
    }

    spawn(player, laneId, type = 'click', holdLength = 0, speed = 5.5) {
        const note = new Note(player, laneId, type, holdLength, speed);
        this.notes.push(note);
        return note;
    }

    update(dt, userSpeed, gameMode, autoPlay, currentDiff, handlers) {
        this.notes.forEach(note => {
            note.update(dt, userSpeed, gameMode, autoPlay, currentDiff, handlers);
        });
        this.notes = this.notes.filter(note => !note.isFinished);
    }

    draw(ctx, gameMode) {
        this.notes.forEach(note => note.draw(ctx, gameMode));
    }

    clear() {
        this.notes = [];
    }

    getNotes() {
        return this.notes;
    }
}
