/**
 * ╔══════════════════════════════════════════════════════╗
 * ║        AMBIENT AUDIO  ·  ПУТЬ В РАЙ                 ║
 * ║                                                      ║
 * ║  Подключи на всех страницах перед </body>:           ║
 * ║  <script src="ambient-audio.js"></script>            ║
 * ║                                                      ║
 * ║  Положи свой аудиофайл рядом с html и укажи         ║
 * ║  имя в AUDIO_FILE ниже.                              ║
 * ╚══════════════════════════════════════════════════════╝
 */

(function () {
  'use strict';

  /* ── НАСТРОЙКИ ───────────────────────────────────── */
  const AUDIO_FILE   = 'ambient.mp3';  // твой файл (.mp3 / .ogg / .wav)
  const VOLUME       = 0.1;           // громкость 0.0 — 1.0
  const FADE_IN_MS   = 1800;           // плавное нарастание при старте (мс)
  const SAVE_EVERY   = 2000;           // как часто сохранять позицию (мс)
  const STORAGE_KEY  = 'vhs_ambient_pos'; // ключ в localStorage
  /* ─────────────────────────────────────────────────── */

  /* ── КНОПКА MUTE ── */
  const btnStyle = document.createElement('style');
  btnStyle.textContent = `
    #ambient-btn {
      position: fixed;
      bottom: 28px;
      right: 18px;
      z-index: 9000;
      width: 34px;
      height: 34px;
      background: rgba(10,0,0,0.75);
      border: 1px solid rgba(204,0,0,0.4);
      color: #cc0000;
      font-family: 'Courier New', monospace;
      font-size: 15px;
      line-height: 34px;
      text-align: center;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(204,0,0,0.15);
      transition: border-color 0.2s, box-shadow 0.2s, color 0.2s;
      user-select: none;
      backdrop-filter: blur(3px);
    }
    #ambient-btn:hover {
      border-color: rgba(204,0,0,0.85);
      box-shadow: 0 0 16px rgba(204,0,0,0.35);
      color: #ff4444;
    }
    #ambient-btn.muted {
      color: #444;
      border-color: rgba(100,0,0,0.25);
      box-shadow: none;
    }
  `;
  document.head.appendChild(btnStyle);

  const btn = document.createElement('div');
  btn.id = 'ambient-btn';
  btn.title = 'Фоновый звук вкл/выкл';
  btn.textContent = '♫';
  document.body.appendChild(btn);

  /* ── АУДИО ── */
  const audio = new Audio(AUDIO_FILE);
  audio.loop   = true;
  audio.volume = 0;  // стартуем с 0, потом fade-in

  let muted    = false;
  let started  = false;
  let saveTimer = null;

  /* Восстанавливаем позицию */
  function restorePosition() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        audio.currentTime = parseFloat(saved);
      }
    } catch (e) {}
  }

  /* Сохраняем позицию */
  function savePosition() {
    try {
      localStorage.setItem(STORAGE_KEY, audio.currentTime.toFixed(2));
    } catch (e) {}
  }

  /* Плавное нарастание громкости */
  function fadeIn() {
    const target  = VOLUME;
    const steps   = 40;
    const stepMs  = FADE_IN_MS / steps;
    const stepVol = target / steps;
    let current   = 0;
    const timer = setInterval(() => {
      current += stepVol;
      audio.volume = Math.min(current, target);
      if (current >= target) clearInterval(timer);
    }, stepMs);
  }

  /* Запуск аудио (требует жеста пользователя) */
  function startAudio() {
    if (started) return;
    started = true;
    restorePosition();
    audio.play().then(() => {
      fadeIn();
      /* Периодически сохраняем позицию */
      saveTimer = setInterval(savePosition, SAVE_EVERY);
    }).catch(() => {
      started = false; // попробуем снова при следующем жесте
    });
  }

  /* Сохраняем позицию перед уходом со страницы */
  window.addEventListener('pagehide', savePosition);
  window.addEventListener('beforeunload', savePosition);
  /* На мобильных visibilitychange важнее */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) savePosition();
  });

  /* ── КНОПКА MUTE/UNMUTE ── */
  btn.addEventListener('click', () => {
    if (!started) {
      startAudio();
      return;
    }
    muted = !muted;
    if (muted) {
      audio.volume = 0;
      btn.textContent = '♪';
      btn.classList.add('muted');
    } else {
      audio.volume = VOLUME;
      btn.textContent = '♫';
      btn.classList.remove('muted');
    }
  });

  /* ── АВТОЗАПУСК при первом жесте пользователя ── */
  /* Браузеры блокируют autoplay без взаимодействия — слушаем любой жест */
  const gestureEvents = ['click', 'keydown', 'touchstart', 'scroll'];
  function onFirstGesture() {
    startAudio();
    gestureEvents.forEach(ev => document.removeEventListener(ev, onFirstGesture, { capture: true }));
  }
  gestureEvents.forEach(ev => document.addEventListener(ev, onFirstGesture, { capture: true, once: true }));

})();