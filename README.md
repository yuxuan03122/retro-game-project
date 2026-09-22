# Rhythm Game (Audio-Synced Edition)

> 🎮 現代模組化 HTML5 雙人/單人音樂節奏遊戲，具備 Web Audio 即時頻率分析對拍與動態譜面生成。

- 👤 **Author**: [yuxuan03122](https://github.com/yuxuan03122)
- 🌐 **Live Demo**: [https://yuxuan03122.github.io/retro-game-project/](https://yuxuan03122.github.io/retro-game-project/)

---

## 🌟 特色一覽

- **原生 ES6 模組化架構**：清晰的遊戲引擎分層（`core/`, `entities/`, `systems/`, `ui/`），無循環依賴。
- **雙譜面模式**：
  - **CLASSIC 模式**：內建固定步進電子音合成器譜面。
  - **CUSTOM MP3 模式**：上傳任意 MP3 音訊，透過 Web Audio API `AnalyserNode` 即時分析低頻（鼓點）與中高頻（旋律）動態對拍生成下落音符。
- **單人 / 雙人對戰**：支援 1P 單人模式與 2P 雙人同屏對戰，獨立血條與得分統計。
- **多元判定機制**：PERFECT / GOOD / MISS 精準判定，支援 Click 音符與 Hold 長按連擊累積機制。
- **AUTO 輔助打擊**：支援一鍵切換 `Tab` 自動打擊展示模式。
- **霓虹科技視覺**：客製化 HTML5 Canvas 2D 發光渲染、動態打擊爆炸與 Hold 軌道粒子特效。

---

## 📁 專案架構

```text
├── index.html                  # 遊戲頁面容器與 ES Module 入口
├── css/
│   └── style.css               # 霓虹視覺與介面樣式表
├── assets/
│   ├── images/                 # 影像資產目錄 (.gitkeep)
│   └── audio/                  # 音訊資產目錄 (.gitkeep)
└── js/
    ├── config.js               # 遊戲設定、軌道座標、難度與常數
    ├── main.js                 # 遊戲啟動入口
    ├── core/
    │   ├── Game.js             # 遊戲主控制器 (State Machine & Dispatcher)
    │   ├── GameLoop.js         # 高精度 Delta Time 循環器
    │   └── InputHandler.js     # 集中事件監聽器 (鍵盤/滑鼠/UI)
    ├── entities/
    │   ├── Entity.js           # 實體基類
    │   ├── Player.js           # 玩家狀態實體 (血量、分數、Combo)
    │   └── Note.js             # 音符實體 (Click / Hold 音符)
    ├── systems/
    │   ├── Physics.js          # 距離判定系統
    │   ├── ParticleSystem.js   # 粒子特效系統
    │   └── AudioSystem.js      # Web Audio 合成器與即時頻譜分析
    └── ui/
        └── HUD.js              # Canvas 2D 介面、選單與結算渲染
```

---

## 🕹️ 遊戲操作說明

- **選單操作**：
  - `↑ / ↓` 或 `W / S`：切換選項
  - `← / →` 或 `A / D`：調整數值（譜面模式、1P/2P、難度、速度）
  - `Space` 或 `Enter`：開始 / 確定
  - 點擊畫面中央按鈕可上傳自訂 MP3 檔案
- **打擊按鍵**：
  - **1P (單人/左側)**：`A S W D` 或 `← ↓ ↑ →`
  - **2P (右側)**：`← ↓ ↑ →`
- **功能快捷鍵**：
  - `Tab`：切換 AUTO 自動打擊模式
  - `Esc` 或 `P`：暫停 / 繼續
  - `R`（暫停時）：重新開始遊戲

---

## 🚀 本機運行方式

本專案採用原生 ES6 Modules，請透過 HTTP 靜態伺服器開啟：

```bash
# 使用 npx serve
npx serve .

# 或使用 Python
python -m http.server 8000
```
瀏覽器開啟 `http://localhost:8000` 即可遊玩！
