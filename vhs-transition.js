(function () {
  'use strict';
 
  /* ── НАСТРОЙКИ ─────────────────────────────────── */
  const DURATION   = 400;          // мс — скорость перехода (0.4 сек)
  const SOUND_FILE = 'transition.mp3'; // файл звука (положи рядом с html)
  /* ────────────────────────────────────────────── */
 
  /* ── СТИЛИ ОВЕРЛЕЯ ── */
  const style = document.createElement('style');
  style.textContent = `
    #vhs-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
      opacity: 0;
      background: #000;
      overflow: hidden;
    }
 
    /* Горизонтальные полосы трекинга */
    #vhs-overlay::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.45) 2px,
        rgba(0,0,0,0.45) 4px
      );
      z-index: 1;
    }
 
    /* Шум / статика */
    #vhs-noise {
      position: absolute;
      inset: 0;
      z-index: 2;
      opacity: 0.55;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 180px 180px;
      animation: vhs-noise-anim 0.08s steps(1) infinite;
    }
    @keyframes vhs-noise-anim {
      0%   { background-position:   0px   0px; transform: scaleX(1); }
      14%  { background-position: -60px  30px; transform: scaleX(1.003); }
      28%  { background-position:  40px -50px; transform: scaleX(0.998); }
      42%  { background-position: -20px  70px; transform: scaleX(1.005); }
      57%  { background-position:  80px -10px; transform: scaleX(1); }
      71%  { background-position: -40px  45px; transform: scaleX(0.997); }
      85%  { background-position:  20px -30px; transform: scaleX(1.002); }
      100% { background-position:   0px   0px; transform: scaleX(1); }
    }
 
    /* Трекинг-бар — белая полоса прокрутки */
    #vhs-track-bar {
      position: absolute;
      left: 0; right: 0;
      height: 60px;
      background: linear-gradient(
        180deg,
        transparent 0%,
        rgba(255,255,255,0.12) 20%,
        rgba(255,255,255,0.28) 50%,
        rgba(255,255,255,0.12) 80%,
        transparent 100%
      );
      z-index: 3;
      top: -60px;
    }
 
    /* Хроматическая аберрация — RGB сдвиг */
    #vhs-chroma {
      position: absolute;
      inset: 0;
      z-index: 4;
      mix-blend-mode: screen;
      opacity: 0.35;
      background: linear-gradient(
        90deg,
        rgba(255,0,0,0.15) 0%,
        transparent 30%,
        transparent 70%,
        rgba(0,255,255,0.15) 100%
      );
      animation: vhs-chroma-shift 0.15s steps(1) infinite;
    }
    @keyframes vhs-chroma-shift {
      0%   { transform: translateX(0px); }
      33%  { transform: translateX(-3px); }
      66%  { transform: translateX(3px); }
      100% { transform: translateX(0px); }
    }
 
    /* Горизонтальный разрыв — глитч-полоса */
    #vhs-tear {
      position: absolute;
      left: 0; right: 0;
      height: 4px;
      background: rgba(255,255,255,0.6);
      z-index: 5;
      top: 30%;
      opacity: 0;
      animation: vhs-tear-anim 0.18s steps(1) infinite;
    }
    @keyframes vhs-tear-anim {
      0%,60%,100% { opacity: 0; top: 30%; }
      20%  { opacity: 1; top: 22%; height: 3px; }
      40%  { opacity: 0.7; top: 68%; height: 5px; }
      80%  { opacity: 1; top: 45%; height: 2px; }
    }
 
    /* Яркая вспышка в центре перехода */
    #vhs-flash {
      position: absolute;
      inset: 0;
      z-index: 6;
      background: #fff;
      opacity: 0;
    }
 
    /* Красная "PAUSE" надпись как у VHS */
    #vhs-label {
      position: absolute;
      top: 12px; left: 16px;
      z-index: 7;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      letter-spacing: 3px;
      color: rgba(255,60,60,0.9);
      text-shadow: 2px 0 0 rgba(0,255,255,0.5), -2px 0 0 rgba(255,0,0,0.5);
      opacity: 0;
    }
 
    /* Вертикальное смещение — эффект перемотки */
    #vhs-roll {
      position: absolute;
      inset: 0;
      z-index: 8;
      background: #000;
      opacity: 0;
      clip-path: inset(0 0 100% 0);
    }
  `;
  document.head.appendChild(style);
 
  /* ── DOM ОВЕРЛЕЯ ── */
  const overlay = document.createElement('div');
  overlay.id = 'vhs-overlay';
  overlay.innerHTML = `
    <div id="vhs-noise"></div>
    <div id="vhs-track-bar"></div>
    <div id="vhs-chroma"></div>
    <div id="vhs-tear"></div>
    <div id="vhs-flash"></div>
    <div id="vhs-label">■ STOP</div>
    <div id="vhs-roll"></div>
  `;
  document.body.appendChild(overlay);
 
  const trackBar = overlay.querySelector('#vhs-track-bar');
  const flash    = overlay.querySelector('#vhs-flash');
  const label    = overlay.querySelector('#vhs-label');
  const roll     = overlay.querySelector('#vhs-roll');
 
  /* ── ЗВУК ── */
  let audio = null;
  try {
    audio = new Audio(SOUND_FILE);
    audio.preload = 'auto';
    audio.volume  = 0.2;
  } catch (e) { audio = null; }
 
  /* ── АНИМАЦИЯ ТРЕКИНГ-БАРА ── */
  function animateTrackBar(duration) {
    const start = performance.now();
    const totalTravel = window.innerHeight + 60;
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const y = t * totalTravel - 60;
      trackBar.style.top = y + 'px';
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
 
  /* ── ОСНОВНАЯ ФУНКЦИЯ ПЕРЕХОДА ── */
  function vhsTransition(targetHref) {
    overlay.style.pointerEvents = 'all'; // блокируем клики во время перехода
 
    /* Играем звук */
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {}); // тихо игнорируем если браузер блокирует
    }
 
    const half = DURATION / 2;
 
    /* ─── ФАЗА 1: fade-in оверлея ─── */
    overlay.style.transition = `opacity ${half * 0.6}ms ease-in`;
    overlay.style.opacity = '1';
 
    /* Показываем надпись */
    setTimeout(() => {
      label.style.opacity = '1';
    }, 30);
 
    /* Трекинг-бар проезжает сверху вниз */
    animateTrackBar(DURATION * 0.9);
 
    /* Вспышка в центре */
    setTimeout(() => {
      flash.style.transition = `opacity ${half * 0.25}ms ease-out`;
      flash.style.opacity = '0.9';
      setTimeout(() => {
        flash.style.opacity = '0';
      }, half * 0.25);
    }, half * 0.7);
 
    /* ─── ФАЗА 2: переход на новую страницу ─── */
    setTimeout(() => {
      window.location.href = targetHref;
    }, DURATION * 0.4);
  }
 
  /* ── ПЕРЕХВАТ КЛИКОВ ПО ССЫЛКАМ ── */
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href]');
    if (!link) return;
 
    const href = link.getAttribute('href');
    if (!href) return;
 
    /* Пропускаем: внешние ссылки, якоря, mailto, tel, javascript */
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:') ||
      link.target === '_blank'
    ) return;
 
    e.preventDefault();
    vhsTransition(href);
  }, true);
 
  /* ── ПЛАВНЫЙ ВХОД НА СТРАНИЦУ (fade-in после загрузки) ── */
  overlay.style.opacity = '1';
  overlay.style.transition = 'none';
  // Пускаем трекинг при входе тоже
  requestAnimationFrame(() => {
    animateTrackBar(DURATION * 0.8);
    setTimeout(() => {
      overlay.style.transition = `opacity ${DURATION * 0.6}ms ease-out`;
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }, DURATION * 0.5);
  });
 
})();
