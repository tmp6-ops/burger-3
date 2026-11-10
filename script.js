/* =========================================================
   THE INFINITY BURGER - COMPLETE GAME ENGINE & AUDIO SYSTEM
   Designed with procedural Web Audio (BGM + Interactive SFX)
========================================================= */

// --- 1. Procedural Retro Chiptune & FX Audio Engine ---
class RetroAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.step = 0;

    // Upbeat diner melody loop notes (in Hz)
    this.melody = [
      261.63, 0, 329.63, 392.00, 0, 440.00, 392.00, 329.63,
      293.66, 0, 349.23, 440.00, 0, 523.25, 440.00, 349.23,
      261.63, 0, 329.63, 392.00, 523.25, 0, 587.33, 523.25,
      392.00, 329.63, 293.66, 261.63, 293.66, 0, 392.00, 0
    ];

    // Bass line accompaniment
    this.bass = [
      130.81, 130.81, 130.81, 130.81,
      146.83, 146.83, 146.83, 146.83,
      130.81, 130.81, 130.81, 130.81,
      196.00, 196.00, 196.00, 196.00
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.bgmPlaying && !this.isMuted) {
      this.startBGM();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  startBGM() {
    if (!this.ctx || this.bgmPlaying) return;
    this.bgmPlaying = true;
    const tempoMs = 135;

    this.bgmTimer = setInterval(() => {
      if (this.isMuted) return;
      const now = this.ctx.currentTime;

      // Play lead melody note
      const note = this.melody[this.step % this.melody.length];
      if (note > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(note, now);

        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.13);
      }

      // Play bass rhythm (every 2 steps)
      if (this.step % 2 === 0) {
        const bassNote = this.bass[Math.floor(this.step / 2) % this.bass.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassNote, now);

        bassGain.gain.setValueAtTime(0.08, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.23);
      }

      // Snare hit every 4 steps
      if (this.step % 4 === 2) {
        this.playHiHat(now);
      }

      this.step++;
    }, tempoMs);
  }

  playHiHat(time) {
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.03, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.04);
  }

  // --- Sound Effects ---
  playDrop(type = 'normal') {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    if (type === 'patty') {
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
    } else if (type === 'cheese') {
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.14);
    } else if (type === 'veggie') {
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);
    } else {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    }

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playPerfectCombo(combo) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 330;
    const pitch = baseFreq * Math.pow(1.08, Math.min(combo, 14));
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playMilestone() {
    if (!this.ctx || this.isMuted) return;
    const notes = [392, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    });
  }

  playTopple() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.linearRampToValueAtTime(35, now + 0.65);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.65);
  }

  playVictory() {
    if (!this.ctx || this.isMuted) return;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }
}

// --- 2. Particle FX Engine ---
class FXEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop();
  }

  resize() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
  }

  burst(x, y, color = '#f1c40f', count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color,
        size: Math.random() * 5 + 3,
        alpha: 1
      });
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // gravity
      p.alpha *= 0.94;

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      if (p.alpha <= 0.04) {
        this.particles.splice(i, 1);
      }
    }

    requestAnimationFrame(() => this.loop());
  }
}

// --- 3. Game Data & Ingredient Definitions ---
const INGREDIENTS = [
  { id: 'patty', name: 'Beef Patty', icon: '🥩', calories: 280, height: 26, category: 'patty', color: '#5b3014' },
  { id: 'cheese', name: 'Cheddar', icon: '🧀', calories: 110, height: 14, category: 'cheese', color: '#f1c40f' },
  { id: 'lettuce', name: 'Lettuce', icon: '🥬', calories: 10, height: 16, category: 'veggie', color: '#2ecc71' },
  { id: 'tomato', name: 'Tomato', icon: '🍅', calories: 25, height: 18, category: 'veggie', color: '#ff4757' },
  { id: 'bacon', name: 'Crispy Bacon', icon: '🥓', calories: 140, height: 14, category: 'patty', color: '#b33939' },
  { id: 'egg', name: 'Fried Egg', icon: '🍳', calories: 90, height: 16, category: 'cheese', color: '#ffa502' },
  { id: 'pickles', name: 'Pickles', icon: '🥒', calories: 8, height: 14, category: 'veggie', color: '#10ac84' },
  { id: 'onion', name: 'Onion Rings', icon: '🧅', calories: 45, height: 16, category: 'veggie', color: '#f6b93b' }
];

const MILESTONES = [
  { layers: 5, name: 'Dinner Table King 🍔', zoneClass: 'zone-kitchen' },
  { layers: 12, name: 'Rooftop Skyscraper 🏢', zoneClass: 'zone-rooftop' },
  { layers: 25, name: 'Cloud Piercer ☁️', zoneClass: 'zone-clouds' },
  { layers: 40, name: 'Entering The Stratosphere 🚀', zoneClass: 'zone-stratosphere' },
  { layers: 65, name: 'Earth Orbit Snack 🛰️', zoneClass: 'zone-orbit' },
  { layers: 100, name: 'Cosmic Singularity Burger 🌌', zoneClass: 'zone-deepspace' }
];

// --- 4. Main Game State & Engine ---
class InfinityBurgerGame {
  constructor() {
    this.audio = new RetroAudioEngine();
    this.fx = new FXEngine(document.getElementById('fx-canvas'));

    // DOM Elements
    this.container = document.getElementById('game-container');
    this.worldViewport = document.getElementById('world-viewport');
    this.burgerStackEl = document.getElementById('burger-stack');
    this.previewEl = document.getElementById('current-ingredient-preview');
    this.spatulaEl = document.getElementById('spatula-chef');
    this.dropHintEl = document.querySelector('.drop-hint');
    this.layerCountEl = document.getElementById('layer-count');
    this.altitudeEl = document.getElementById('altitude-display');
    this.caloriesEl = document.getElementById('calorie-count');
    this.stabilityBar = document.getElementById('stability-bar');
    this.comboDisplay = document.getElementById('combo-display');
    this.zoneTag = document.getElementById('current-zone-tag');
    this.milestoneBanner = document.getElementById('milestone-banner');
    this.milestoneText = document.getElementById('milestone-text');
    this.modalOverlay = document.getElementById('modal-overlay');

    // Controls
    this.paletteContainer = document.getElementById('ingredient-palette');
    this.crownBtn = document.getElementById('crown-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.playAgainBtn = document.getElementById('play-again-btn');
    this.audioBtn = document.getElementById('audio-toggle-btn');

    // Game Variables
    this.stack = [];
    this.totalHeightPx = 0;
    this.totalCalories = 0;
    this.stability = 100;
    this.combo = 0;
    this.selectedIngredient = INGREDIENTS[0];
    this.isToppled = false;
    this.isFinished = false;

    // Moving Spatula Physics
    this.spatulaX = 0;
    this.spatulaDirection = 1;
    this.spatulaSpeed = 2.4;
    this.spatulaRange = 90;

    this.init();
  }

  init() {
    this.buildPalette();
    this.bindEvents();
    this.resetGame();
    this.gameLoop();
  }

  buildPalette() {
    this.paletteContainer.innerHTML = '';
    INGREDIENTS.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.className = `palette-btn ${idx === 0 ? 'active' : ''}`;
      btn.innerHTML = `
        <span class="icon">${item.icon}</span>
        <span class="name">${item.name}</span>
        <span class="cal">${item.calories} kcal</span>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audio.init();
        this.selectIngredient(item);
      });
      this.paletteContainer.appendChild(btn);
    });
  }

  selectIngredient(item) {
    this.selectedIngredient = item;
    const buttons = this.paletteContainer.querySelectorAll('.palette-btn');
    buttons.forEach(b => b.classList.remove('active'));
    const idx = INGREDIENTS.findIndex(i => i.id === item.id);
    if (buttons[idx]) buttons[idx].classList.add('active');
    this.updatePreview();
  }

  updatePreview() {
    this.previewEl.className = `ingredient ${this.selectedIngredient.id}`;
  }

  bindEvents() {
    // Drop ingredient on click/tap
    this.worldViewport.addEventListener('pointerdown', () => {
      this.audio.init();
      if (!this.isToppled && !this.isFinished) {
        this.dropCurrentIngredient();
      }
    });

    this.crownBtn.addEventListener('click', () => {
      this.audio.init();
      this.finishAndCrownBurger();
    });

    this.resetBtn.addEventListener('click', () => {
      this.audio.init();
      this.resetGame();
    });

    this.playAgainBtn.addEventListener('click', () => {
      this.audio.init();
      this.modalOverlay.classList.add('hidden');
      this.resetGame();
    });

    // Audio mute toggle button
    this.audioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.audio.init();
      const muted = this.audio.toggleMute();
      this.audioBtn.textContent = muted ? '🔇' : '🔊';
      this.audioBtn.classList.toggle('muted', muted);
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.audio.init();
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (!this.isToppled && !this.isFinished) {
          this.dropCurrentIngredient();
        }
      } else if (e.key >= '1' && e.key <= '8') {
        const item = INGREDIENTS[parseInt(e.key) - 1];
        if (item) this.selectIngredient(item);
      } else if (e.key.toLowerCase() === 'm') {
        const muted = this.audio.toggleMute();
        this.audioBtn.textContent = muted ? '🔇' : '🔊';
        this.audioBtn.classList.toggle('muted', muted);
      }
    });
  }

  resetGame() {
    this.isToppled = false;
    this.isFinished = false;
    this.stack = [];
    this.totalHeightPx = 0;
    this.totalCalories = 0;
    this.stability = 100;
    this.combo = 0;
    this.spatulaSpeed = 2.4;

    this.container.className = 'zone-kitchen';
    this.zoneTag.textContent = 'Kitchen Counter 🍳';

    const plate = document.getElementById('plate');
    this.burgerStackEl.innerHTML = '';
    this.burgerStackEl.appendChild(plate);

    this.addBunBottom();
    this.updateHUD();
    this.selectIngredient(INGREDIENTS[0]);
    this.modalOverlay.classList.add('hidden');
  }

  addBunBottom() {
    const bottomBun = document.createElement('div');
    bottomBun.className = 'ingredient bun-bottom';
    bottomBun.style.bottom = `12px`;
    bottomBun.style.transform = `translateX(-50%)`;
    this.burgerStackEl.appendChild(bottomBun);

    this.stack.push({
      id: 'bun-bottom',
      name: 'Bottom Bun',
      offsetX: 0,
      height: 30,
      calories: 120
    });
    this.totalHeightPx += 30;
    this.totalCalories += 120;
  }

  dropCurrentIngredient() {
    if (this.dropHintEl) {
      this.dropHintEl.style.display = 'none';
    }
    const item = this.selectedIngredient;
    const currentOffset = this.spatulaX;
    const lastPiece = this.stack[this.stack.length - 1];
    const misalignment = Math.abs(currentOffset - lastPiece.offsetX);

    let stabilityLoss = 0;
    let isPerfect = false;

    if (misalignment < 8) {
      // Bullseye / Perfect alignment
      this.combo++;
      this.audio.playPerfectCombo(this.combo);
      this.comboDisplay.classList.add('pop');
      setTimeout(() => this.comboDisplay.classList.remove('pop'), 200);

      this.stability = Math.min(100, this.stability + 4);
      isPerfect = true;
    } else {
      this.combo = 0;
      stabilityLoss = misalignment * 0.42;
      this.stability = Math.max(0, this.stability - stabilityLoss);
      this.audio.playDrop(item.category);
    }

    const elem = document.createElement('div');
    elem.className = `ingredient ${item.id} just-landed`;
    elem.style.bottom = `${this.totalHeightPx + 12}px`;

    const tilt = (currentOffset * 0.12).toFixed(1);
    elem.style.transform = `translateX(-50%) translateX(${currentOffset}px) rotate(${tilt}deg)`;

    this.burgerStackEl.appendChild(elem);

    this.stack.push({
      id: item.id,
      name: item.name,
      offsetX: currentOffset,
      height: item.height,
      calories: item.calories
    });

    this.totalHeightPx += item.height;
    this.totalCalories += item.calories;

    const viewportRect = this.worldViewport.getBoundingClientRect();
    const spawnX = viewportRect.width / 2 + currentOffset;
    const spawnY = viewportRect.height - 70;
    this.fx.burst(spawnX, spawnY, isPerfect ? '#ff9ff3' : item.color, isPerfect ? 24 : 14);

    this.adjustCamera();
    this.checkMilestones();

    this.spatulaSpeed = 2.4 + Math.min(this.stack.length * 0.08, 4.5);

    if (this.stability <= 0) {
      this.collapseTower();
      return;
    }

    this.updateHUD();
  }

  finishAndCrownBurger() {
    if (this.isToppled || this.isFinished || this.stack.length < 2) return;
    this.isFinished = true;

    const topBun = document.createElement('div');
    topBun.className = 'ingredient bun-top just-landed';
    topBun.style.bottom = `${this.totalHeightPx + 12}px`;
    topBun.style.transform = `translateX(-50%)`;
    this.burgerStackEl.appendChild(topBun);

    this.totalHeightPx += 55;
    this.totalCalories += 130;
    this.audio.playVictory();

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.fx.burst(
          this.canvasWidth() * Math.random(),
          this.canvasHeight() * 0.3,
          ['#ffb703', '#ff4757', '#2ecc71', '#ff9ff3'][i % 4],
          32
        );
      }, i * 180);
    }

    setTimeout(() => {
      this.showEndModal('CROWNED FEAST! 👑', 'Master Chef Achievement Unlocked!');
    }, 1200);
  }

  collapseTower() {
    this.isToppled = true;
    this.audio.playTopple();

    const children = Array.from(this.burgerStackEl.querySelectorAll('.ingredient'));
    children.forEach((child, idx) => {
      if (idx === 0) return;
      const flyX = (Math.random() - 0.5) * 500;
      const flyY = Math.random() * 200 + 100;
      const rot = (Math.random() - 0.5) * 360;
      child.style.transition = 'transform 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53), opacity 0.8s';
      child.style.transform = `translateX(calc(-50% + ${flyX}px)) translateY(${flyY}px) rotate(${rot}deg)`;
      child.style.opacity = '0';
    });

    setTimeout(() => {
      this.showEndModal('TOWER TOPPLED! 💥', 'The laws of physics caught up with your burger.');
    }, 900);
  }

  adjustCamera() {
    const maxVisibleHeight = 300;
    if (this.totalHeightPx > maxVisibleHeight) {
      const scrollOffset = this.totalHeightPx - maxVisibleHeight;
      this.burgerStackEl.style.transform = `translateY(${scrollOffset}px)`;
    } else {
      this.burgerStackEl.style.transform = `translateY(0px)`;
    }
  }

  checkMilestones() {
    const layerCount = this.stack.length;
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      const m = MILESTONES[i];
      if (layerCount === m.layers) {
        this.container.className = m.zoneClass;
        this.zoneTag.textContent = m.name;
        this.audio.playMilestone();
        this.triggerMilestoneBanner(m.name);
        break;
      }
    }
  }

  triggerMilestoneBanner(text) {
    this.milestoneText.textContent = text;
    this.milestoneBanner.classList.remove('hidden');
    this.milestoneBanner.style.animation = 'none';
    this.milestoneBanner.offsetHeight;
    this.milestoneBanner.style.animation = null;
  }

  updateHUD() {
    this.layerCountEl.textContent = this.stack.length;
    const meters = (this.totalHeightPx * 0.02).toFixed(1);
    this.altitudeEl.textContent = `${meters} m`;
    this.caloriesEl.textContent = this.totalCalories.toLocaleString();

    this.stabilityBar.style.width = `${this.stability}%`;
    this.stabilityBar.classList.remove('warning', 'danger');
    if (this.stability < 30) {
      this.stabilityBar.classList.add('danger');
    } else if (this.stability < 60) {
      this.stabilityBar.classList.add('warning');
    }

    this.comboDisplay.textContent = `COMBO x${Math.max(1, this.combo)}`;
  }

  showEndModal(title, subtitle) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-subtitle').textContent = subtitle;
    document.getElementById('end-layers').textContent = this.stack.length;
    document.getElementById('end-height').textContent = `${(this.totalHeightPx * 0.02).toFixed(1)} m`;
    document.getElementById('end-calories').textContent = `${this.totalCalories.toLocaleString()} kcal`;

    let rank = 'Snack Byte';
    if (this.stack.length > 50) rank = 'Cosmic Glutton 🌌';
    else if (this.stack.length > 30) rank = 'Atmospheric Gourmet 🚀';
    else if (this.stack.length > 18) rank = 'Skyscraper Artisan 🏢';
    else if (this.stack.length > 8) rank = 'Patty Pro 🍔';

    document.getElementById('end-rank').textContent = rank;
    this.modalOverlay.classList.remove('hidden');
  }

  canvasWidth() {
    return this.worldViewport.clientWidth;
  }

  canvasHeight() {
    return this.worldViewport.clientHeight;
  }

  gameLoop() {
    if (!this.isToppled && !this.isFinished) {
      this.spatulaX += this.spatulaDirection * this.spatulaSpeed;

      if (this.spatulaX > this.spatulaRange) {
        this.spatulaX = this.spatulaRange;
        this.spatulaDirection = -1;
      } else if (this.spatulaX < -this.spatulaRange) {
        this.spatulaX = -this.spatulaRange;
        this.spatulaDirection = 1;
      }

      this.spatulaEl.style.transform = `translateX(calc(-50% + ${this.spatulaX}px))`;
    }

    requestAnimationFrame(() => this.gameLoop());
  }
}

// Start Game on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  new InfinityBurgerGame();
});
