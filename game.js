/**
 * 0nesTensThousands - Interactive Math Learning Game
 * Level 1: Hundreds (H), Tens (T), Ones (O) Place Values (Q5)
 * Level 2: Match the Following - Expanded Form to Standard Number (Q6)
 * Level 3: 100s Grid - Fill Missing Numbers (101-200 up to 901-1000) (Q7)
 */

(function () {
  'use strict';

  // ==========================================
  // Audio Synthesizer (Web Audio API)
  // ==========================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = localStorage.getItem('0tt_muted') === 'true';
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      localStorage.setItem('0tt_muted', this.isMuted);
      return this.isMuted;
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.error(e);
      }
    }

    playClick() {
      this.playTone(600, 'sine', 0.08, 0.05);
    }

    playConnect() {
      this.playTone(480, 'triangle', 0.12, 0.08);
    }

    playSuccess() {
      if (this.isMuted) return;
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.22, 0.12);
        }, idx * 70);
      });
    }

    playError() {
      if (this.isMuted) return;
      this.init();
      this.playTone(220, 'sawtooth', 0.18, 0.08);
      setTimeout(() => {
        this.playTone(196, 'sawtooth', 0.22, 0.08);
      }, 100);
    }

    playFanfare() {
      if (this.isMuted) return;
      this.init();
      const fanfare = [
        { f: 523.25, d: 0.15, t: 0 },
        { f: 523.25, d: 0.15, t: 150 },
        { f: 523.25, d: 0.15, t: 300 },
        { f: 659.25, d: 0.35, t: 450 },
        { f: 587.33, d: 0.15, t: 800 },
        { f: 783.99, d: 0.55, t: 950 }
      ];
      fanfare.forEach(item => {
        setTimeout(() => {
          this.playTone(item.f, 'triangle', item.d, 0.15);
        }, item.t);
      });
    }
  }

  // ==========================================
  // Confetti Particle System
  // ==========================================
  class ConfettiCannon {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.animId = null;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    burst(count = 120) {
      this.resize();
      const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: window.innerWidth / 2 + (Math.random() - 0.5) * 300,
          y: window.innerHeight / 2 + (Math.random() - 0.5) * 150,
          vx: (Math.random() - 0.5) * 18,
          vy: -Math.random() * 15 - 5,
          size: Math.random() * 9 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 12,
          shape: Math.random() > 0.3 ? 'rect' : 'circle',
          alpha: 1,
          gravity: 0.35
        });
      }

      if (!this.animId) {
        this.render();
      }
    }

    render() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.alpha -= 0.007;

        if (p.alpha <= 0 || p.y > this.canvas.height + 50) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animId = requestAnimationFrame(() => this.render());
      } else {
        this.animId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  // ==========================================
  // Global Game Manager & State
  // ==========================================
  const sound = new SoundEngine();
  const confetti = new ConfettiCannon('confettiCanvas');

  let stars = parseInt(localStorage.getItem('0tt_stars') || '0', 10);
  let showBlocksLevel1 = false;

  function updateStarDisplay(delta = 0) {
    if (delta > 0) {
      stars += delta;
      localStorage.setItem('0tt_stars', stars);
    }
    const starEl = document.getElementById('starCount');
    if (starEl) starEl.textContent = stars;
  }

  function showCelebrationModal(title, msg, starReward, nextCallback) {
    sound.playFanfare();
    confetti.burst(150);
    updateStarDisplay(starReward);

    const modal = document.getElementById('celebrationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMsg = document.getElementById('modalMsg');
    const nextBtn = document.getElementById('modalNextBtn');
    const closeBtn = document.getElementById('modalCloseBtn');

    modalTitle.textContent = title || 'Awesome Job!';
    modalMsg.textContent = msg || `You earned +${starReward} Stars! Keep up the brilliant work!`;

    modal.classList.add('show');

    const handleNext = () => {
      modal.classList.remove('show');
      nextBtn.removeEventListener('click', handleNext);
      closeBtn.removeEventListener('click', handleClose);
      if (nextCallback) nextCallback();
    };

    const handleClose = () => {
      modal.classList.remove('show');
      nextBtn.removeEventListener('click', handleNext);
      closeBtn.removeEventListener('click', handleClose);
    };

    nextBtn.addEventListener('click', handleNext);
    closeBtn.addEventListener('click', handleClose);
  }

  // ==========================================
  // LEVEL 1: Write H, T, and O (Question 5)
  // ==========================================
  class Level1Controller {
    constructor() {
      this.container = document.getElementById('l1QuestionsContainer');
      this.refreshBtn = document.getElementById('l1RefreshBtn');
      this.checkBtn = document.getElementById('l1CheckBtn');
      this.hintBtn = document.getElementById('l1HintBtn');
      this.toggleBlocksBtn = document.getElementById('l1ToggleBlocksBtn');
      this.feedbackEl = document.getElementById('l1FeedbackMsg');
      this.questions = [];
      this.letters = ['a', 'b', 'c', 'd', 'e'];

      this.initEvents();
      // Initial load with 3 questions matching the worksheet (562, 809, 147)
      this.loadQuestions([562, 809, 147]);
    }

    initEvents() {
      this.refreshBtn.addEventListener('click', () => {
        sound.playClick();
        this.generateRandomQuestions(3);
        this.showFeedback('New practice numbers generated! You got this! 🚀', 'hint');
      });

      this.checkBtn.addEventListener('click', () => {
        this.checkAnswers();
      });

      this.hintBtn.addEventListener('click', () => {
        sound.playClick();
        this.showFeedback('💡 In a 3-digit number (like 562): 1st digit is Hundreds (H), 2nd digit is Tens (T), 3rd digit is Ones (O)!', 'hint');
      });

      this.toggleBlocksBtn.addEventListener('click', () => {
        sound.playClick();
        showBlocksLevel1 = !showBlocksLevel1;
        this.toggleBlocksBtn.innerHTML = showBlocksLevel1
          ? '🧱 <span>Hide Base-10 Blocks</span>'
          : '🧱 <span>Show Base-10 Blocks</span>';
        this.render();
      });
    }

    generateRandomQuestions(count = 3) {
      const nums = [];
      while (nums.length < count) {
        // Generate random 3-digit number between 101 and 999
        let n;
        const r = Math.random();
        if (r < 0.3) {
          // Zero in tens place (e.g. 809, 405)
          const h = Math.floor(Math.random() * 9) + 1;
          const o = Math.floor(Math.random() * 9) + 1;
          n = h * 100 + o;
        } else if (r < 0.5) {
          // Zero in ones place (e.g. 560, 710)
          const h = Math.floor(Math.random() * 9) + 1;
          const t = Math.floor(Math.random() * 9) + 1;
          n = h * 100 + t * 10;
        } else {
          n = Math.floor(Math.random() * 900) + 100;
        }

        if (!nums.includes(n)) {
          nums.push(n);
        }
      }
      this.loadQuestions(nums);
    }

    loadQuestions(numbers) {
      this.questions = numbers.map((num, idx) => {
        const s = num.toString().padStart(3, '0');
        return {
          id: `q1_${idx}`,
          letter: this.letters[idx] || `${idx + 1}`,
          number: num,
          h: parseInt(s[0], 10),
          t: parseInt(s[1], 10),
          o: parseInt(s[2], 10),
          userH: '',
          userT: '',
          userO: '',
          isCorrect: null
        };
      });
      this.render();
    }

    showFeedback(text, type = 'hint') {
      this.feedbackEl.textContent = text;
      this.feedbackEl.className = `feedback-msg show ${type}`;
    }

    render() {
      this.container.innerHTML = '';
      this.questions.forEach((q, qIdx) => {
        const card = document.createElement('div');
        card.className = `q-card ${q.isCorrect === true ? 'correct' : q.isCorrect === false ? 'wrong' : ''}`;
        card.id = `card_${q.id}`;

        let blocksHtml = '';
        if (showBlocksLevel1) {
          blocksHtml = `
            <div class="base-10-visual">
              <div class="visual-group">
                <div class="visual-items">
                  ${Array(q.h).fill('<div class="block-hundred" title="100"></div>').join('')}
                </div>
                <span class="visual-caption">${q.h} Hundreds (${q.h * 100})</span>
              </div>
              <div class="visual-group">
                <div class="visual-items">
                  ${Array(q.t).fill('<div class="block-ten" title="10"></div>').join('')}
                </div>
                <span class="visual-caption">${q.t} Tens (${q.t * 10})</span>
              </div>
              <div class="visual-group">
                <div class="visual-items">
                  ${Array(q.o).fill('<div class="block-one" title="1"></div>').join('')}
                </div>
                <span class="visual-caption">${q.o} Ones (${q.o})</span>
              </div>
            </div>
          `;
        }

        card.innerHTML = `
          <div class="q-row">
            <span class="q-letter">${q.letter}.</span>
            <div class="q-number-badge">${q.number}</div>
            <span class="q-divider">:</span>
            <div class="place-inputs-group">
              <div class="place-input-box">
                <input type="text" maxlength="1" inputmode="numeric" 
                       class="digit-input input-h" data-qid="${qIdx}" data-field="h"
                       value="${q.userH}" placeholder="_" autocomplete="off" />
                <span class="unit-label lbl-h">H,</span>
              </div>
              <div class="place-input-box">
                <input type="text" maxlength="1" inputmode="numeric" 
                       class="digit-input input-t" data-qid="${qIdx}" data-field="t"
                       value="${q.userT}" placeholder="_" autocomplete="off" />
                <span class="unit-label lbl-t">T,</span>
              </div>
              <div class="place-input-box">
                <input type="text" maxlength="1" inputmode="numeric" 
                       class="digit-input input-o" data-qid="${qIdx}" data-field="o"
                       value="${q.userO}" placeholder="_" autocomplete="off" />
                <span class="unit-label lbl-o">O</span>
              </div>
            </div>
            <div class="q-status-icon">
              ${q.isCorrect === true ? '✅' : q.isCorrect === false ? '❌' : ''}
            </div>
          </div>
          ${blocksHtml}
        `;

        this.container.appendChild(card);
      });

      this.bindInputs();
    }

    bindInputs() {
      const inputs = Array.from(this.container.querySelectorAll('.digit-input'));
      inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
          const val = e.target.value.replace(/[^0-9]/g, '');
          e.target.value = val;
          const qIdx = parseInt(input.getAttribute('data-qid'), 10);
          const field = input.getAttribute('data-field');

          if (field === 'h') this.questions[qIdx].userH = val;
          if (field === 't') this.questions[qIdx].userT = val;
          if (field === 'o') this.questions[qIdx].userO = val;

          sound.playClick();

          // Auto-advance to next input field
          if (val.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
            inputs[index + 1].select();
          }
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && input.value === '' && index > 0) {
            inputs[index - 1].focus();
          } else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
            inputs[index + 1].focus();
          } else if (e.key === 'ArrowLeft' && index > 0) {
            inputs[index - 1].focus();
          } else if (e.key === 'Enter') {
            this.checkAnswers();
          }
        });
      });
    }

    checkAnswers() {
      let allFilled = true;
      let totalCorrect = 0;

      this.questions.forEach((q, idx) => {
        const uH = parseInt(q.userH, 10);
        const uT = parseInt(q.userT, 10);
        const uO = parseInt(q.userO, 10);

        if (isNaN(uH) || isNaN(uT) || isNaN(uO)) {
          allFilled = false;
          q.isCorrect = null;
        } else if (uH === q.h && uT === q.t && uO === q.o) {
          q.isCorrect = true;
          totalCorrect++;
        } else {
          q.isCorrect = false;
        }
      });

      this.render();

      if (!allFilled) {
        sound.playError();
        this.showFeedback('Please fill in all blanks for Hundreds, Tens, and Ones! ✏️', 'error');
        return;
      }

      if (totalCorrect === this.questions.length) {
        showCelebrationModal(
          'Outstanding Place Value Master! 🌟',
          `You solved all ${this.questions.length} questions correctly!`,
          3,
          () => this.generateRandomQuestions(3)
        );
        this.showFeedback('🎉 Brilliant! All answers are 100% correct!', 'success');
      } else {
        sound.playError();
        this.showFeedback(
          `You got ${totalCorrect} of ${this.questions.length} correct. Check the red boxes and try again! You can do it! 💪`,
          'error'
        );
      }
    }
  }

  // ==========================================
  // LEVEL 2: Match the Following (Question 6)
  // ==========================================
  class Level2Controller {
    constructor() {
      this.colAContainer = document.getElementById('colAItems');
      this.colBContainer = document.getElementById('colBItems');
      this.svgCanvas = document.getElementById('matchSvgCanvas');
      this.wrapper = document.getElementById('matchWrapper');
      this.refreshBtn = document.getElementById('l2RefreshBtn');
      this.clearBtn = document.getElementById('l2ClearBtn');
      this.checkBtn = document.getElementById('l2CheckBtn');
      this.feedbackEl = document.getElementById('l2FeedbackMsg');

      this.pairs = [];
      this.selectedA = null;
      this.matches = {}; // { itemAId: itemBId }
      this.pairColors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

      this.initEvents();
      // Initialize with exact numbers from the worksheet photo:
      // Column A: 300+40+5, 900+0+2, 600+70+1, 100+80+0, 500+50+5
      // Column B: 671, 345, 902, 555, 180
      this.loadInitialWorksheetPairs();
    }

    initEvents() {
      this.refreshBtn.addEventListener('click', () => {
        sound.playClick();
        this.generateRandomPairs(5);
        this.showFeedback('New random matching pairs generated! 🔄', 'hint');
      });

      this.clearBtn.addEventListener('click', () => {
        sound.playClick();
        this.clearMatches();
      });

      this.checkBtn.addEventListener('click', () => {
        this.checkMatches();
      });

      window.addEventListener('resize', () => this.drawLines());
      window.addEventListener('scroll', () => this.drawLines());
    }

    loadInitialWorksheetPairs() {
      const data = [
        { standard: 345, h: 300, t: 40, o: 5 },
        { standard: 902, h: 900, t: 0, o: 2 },
        { standard: 671, h: 600, t: 70, o: 1 },
        { standard: 180, h: 100, t: 80, o: 0 },
        { standard: 555, h: 500, t: 50, o: 5 }
      ];
      this.setupPairs(data);
    }

    generateRandomPairs(count = 5) {
      const generated = [];
      const usedNumbers = new Set();

      while (generated.length < count) {
        let num;
        const r = Math.random();
        if (r < 0.25) {
          // Zero in tens (e.g. 704)
          const h = (Math.floor(Math.random() * 9) + 1);
          const o = Math.floor(Math.random() * 9) + 1;
          num = h * 100 + o;
        } else if (r < 0.5) {
          // Zero in ones (e.g. 420)
          const h = (Math.floor(Math.random() * 9) + 1);
          const t = Math.floor(Math.random() * 9) + 1;
          num = h * 100 + t * 10;
        } else if (r < 0.7) {
          // Triple digits (e.g. 555, 333)
          const d = Math.floor(Math.random() * 9) + 1;
          num = d * 100 + d * 10 + d;
        } else {
          num = Math.floor(Math.random() * 900) + 100;
        }

        if (!usedNumbers.has(num)) {
          usedNumbers.add(num);
          const s = num.toString().padStart(3, '0');
          const h = parseInt(s[0], 10) * 100;
          const t = parseInt(s[1], 10) * 10;
          const o = parseInt(s[2], 10);
          generated.push({ standard: num, h, t, o });
        }
      }

      this.setupPairs(generated);
    }

    setupPairs(pairData) {
      this.clearMatches();
      this.pairs = pairData.map((item, idx) => ({
        id: `pair_${idx}`,
        standard: item.standard,
        expandedText: `${item.h} + ${item.t} + ${item.o}`,
        color: this.pairColors[idx % this.pairColors.length]
      }));

      this.render();
    }

    clearMatches() {
      this.matches = {};
      this.selectedA = null;
      this.svgCanvas.innerHTML = '';
      const allCards = this.wrapper.querySelectorAll('.match-card');
      allCards.forEach(c => {
        c.classList.remove('selected', 'matched', 'correct-final', 'wrong-final');
        c.style.borderColor = '';
        c.style.background = '';
      });
      this.feedbackEl.className = 'feedback-msg';
    }

    showFeedback(text, type = 'hint') {
      this.feedbackEl.textContent = text;
      this.feedbackEl.className = `feedback-msg show ${type}`;
    }

    render() {
      // Column A: Ordered as generated
      const listA = [...this.pairs];

      // Column B: Shuffled copy
      const listB = [...this.pairs].sort(() => Math.random() - 0.5);

      this.colAContainer.innerHTML = '';
      this.colBContainer.innerHTML = '';

      listA.forEach(item => {
        const card = document.createElement('div');
        card.className = 'match-card col-a';
        card.id = `cardA_${item.id}`;
        card.setAttribute('data-id', item.id);
        card.innerHTML = `
          <span class="match-text">${item.expandedText}</span>
          <div class="match-connector-socket" id="socketA_${item.id}"></div>
        `;
        card.addEventListener('click', () => this.handleCardAClick(item.id));
        this.colAContainer.appendChild(card);
      });

      listB.forEach(item => {
        const card = document.createElement('div');
        card.className = 'match-card col-b';
        card.id = `cardB_${item.id}`;
        card.setAttribute('data-id', item.id);
        card.innerHTML = `
          <div class="match-connector-socket" id="socketB_${item.id}"></div>
          <span class="match-text">* ${item.standard}</span>
        `;
        card.addEventListener('click', () => this.handleCardBClick(item.id));
        this.colBContainer.appendChild(card);
      });

      this.drawLines();
    }

    handleCardAClick(id) {
      sound.playClick();
      // If already connected, disconnect it first
      if (this.matches[id]) {
        delete this.matches[id];
        this.drawLines();
        this.updateCardStyles();
      }

      // Toggle selection
      if (this.selectedA === id) {
        this.selectedA = null;
      } else {
        this.selectedA = id;
      }

      this.updateCardStyles();
    }

    handleCardBClick(bId) {
      if (!this.selectedA) {
        // If child clicked B without choosing A first, find if it's already connected and remove connection
        for (const [aKey, bVal] of Object.entries(this.matches)) {
          if (bVal === bId) {
            delete this.matches[aKey];
            sound.playClick();
            this.drawLines();
            this.updateCardStyles();
            return;
          }
        }
        sound.playTone(400, 'triangle', 0.1);
        this.showFeedback('First click an Expanded Form card in Column A, then click its match in Column B! 👆', 'hint');
        return;
      }

      sound.playConnect();

      // Remove any existing connection pointing to this B
      for (const [aKey, bVal] of Object.entries(this.matches)) {
        if (bVal === bId) {
          delete this.matches[aKey];
        }
      }

      // Connect selectedA to bId
      this.matches[this.selectedA] = bId;
      this.selectedA = null;

      this.drawLines();
      this.updateCardStyles();

      if (Object.keys(this.matches).length === this.pairs.length) {
        this.showFeedback('All items connected! Click "Check Matches" to see your score! ✨', 'hint');
      }
    }

    updateCardStyles() {
      // Clear selections
      this.wrapper.querySelectorAll('.match-card').forEach(c => {
        c.classList.remove('selected', 'matched');
        c.style.borderColor = '';
        c.style.background = '';
      });

      // Highlight selected A
      if (this.selectedA) {
        const cardA = document.getElementById(`cardA_${this.selectedA}`);
        if (cardA) cardA.classList.add('selected');
      }

      // Highlight matches
      Object.entries(this.matches).forEach(([aId, bId], index) => {
        const cardA = document.getElementById(`cardA_${aId}`);
        const cardB = document.getElementById(`cardB_${bId}`);
        const color = this.pairColors[index % this.pairColors.length];

        if (cardA) {
          cardA.classList.add('matched');
          cardA.style.borderColor = color;
        }
        if (cardB) {
          cardB.classList.add('matched');
          cardB.style.borderColor = color;
        }
      });
    }

    drawLines() {
      this.svgCanvas.innerHTML = '';
      const wrapperRect = this.wrapper.getBoundingClientRect();

      Object.entries(this.matches).forEach(([aId, bId], index) => {
        const socketA = document.getElementById(`socketA_${aId}`);
        const socketB = document.getElementById(`socketB_${bId}`);
        if (!socketA || !socketB) return;

        const rectA = socketA.getBoundingClientRect();
        const rectB = socketB.getBoundingClientRect();

        const x1 = rectA.left + rectA.width / 2 - wrapperRect.left;
        const y1 = rectA.top + rectA.height / 2 - wrapperRect.top;
        const x2 = rectB.left + rectB.width / 2 - wrapperRect.left;
        const y2 = rectB.top + rectB.height / 2 - wrapperRect.top;

        const color = this.pairColors[index % this.pairColors.length];

        // Smooth Bezier curve
        const dx = Math.abs(x2 - x1) * 0.45;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        path.setAttribute('d', d);
        path.setAttribute('stroke', color);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-width', '4.5');
        path.setAttribute('stroke-linecap', 'round');

        this.svgCanvas.appendChild(path);
      });
    }

    checkMatches() {
      const matchCount = Object.keys(this.matches).length;
      if (matchCount < this.pairs.length) {
        sound.playError();
        this.showFeedback(`Please connect all ${this.pairs.length} pairs first! (${matchCount}/${this.pairs.length} connected)`, 'error');
        return;
      }

      let allCorrect = true;
      let correctCount = 0;

      Object.entries(this.matches).forEach(([aId, bId]) => {
        const cardA = document.getElementById(`cardA_${aId}`);
        const cardB = document.getElementById(`cardB_${bId}`);
        const isPairCorrect = (aId === bId);

        if (isPairCorrect) {
          correctCount++;
          if (cardA) cardA.classList.add('correct-final');
          if (cardB) cardB.classList.add('correct-final');
        } else {
          allCorrect = false;
          if (cardA) cardA.classList.add('wrong-final');
          if (cardB) cardB.classList.add('wrong-final');
        }
      });

      if (allCorrect) {
        showCelebrationModal(
          'Matching Master! 🎯',
          'You matched every Expanded Form perfectly with its Standard Number!',
          5,
          () => this.generateRandomPairs(5)
        );
        this.showFeedback('🎉 100% Correct Match! Fantastic Job!', 'success');
      } else {
        sound.playError();
        this.showFeedback(
          `You got ${correctCount} of ${this.pairs.length} correct! Check the red cards and click on them to reconnect!`,
          'error'
        );
      }
    }
  }

  // ==========================================
  // LEVEL 3: 100s Grid - Fill Missing Numbers (Question 7)
  // ==========================================
  class Level3Controller {
    constructor() {
      this.gridEl = document.getElementById('grid100');
      this.rangeSelect = document.getElementById('rangeSelect');
      this.diffSelect = document.getElementById('difficultySelect');
      this.refreshBtn = document.getElementById('l3RefreshBtn');
      this.checkBtn = document.getElementById('l3CheckBtn');
      this.hintBtn = document.getElementById('l3HintBtn');
      this.clearBtn = document.getElementById('l3ClearBtn');
      this.revealBtn = document.getElementById('l3RevealBtn');
      this.feedbackEl = document.getElementById('l3FeedbackMsg');
      this.rangeTextEl = document.getElementById('currentRangeText');
      this.filledCountEl = document.getElementById('gridFilledCount');
      this.totalMissingEl = document.getElementById('gridTotalMissing');

      // Keypad
      this.keypadWrapper = document.getElementById('keypadWrapper');
      this.toggleKeypadBtn = document.getElementById('toggleKeypadBtn');
      this.touchKeypad = document.getElementById('touchKeypad');
      this.keypadActiveCell = document.getElementById('keypadActiveCell');

      this.activeInput = null;
      this.startNumber = 501; // Defaults to 501 to 600
      this.cells = []; // 100 items

      this.initEvents();
      this.buildGrid();
    }

    initEvents() {
      this.rangeSelect.addEventListener('change', (e) => {
        sound.playClick();
        this.startNumber = parseInt(e.target.value, 10);
        this.buildGrid();
      });

      this.diffSelect.addEventListener('change', () => {
        sound.playClick();
        this.buildGrid();
      });

      this.refreshBtn.addEventListener('click', () => {
        sound.playClick();
        this.pickRandomRange();
      });

      this.checkBtn.addEventListener('click', () => {
        this.checkGrid();
      });

      this.hintBtn.addEventListener('click', () => {
        sound.playClick();
        this.giveHint();
      });

      this.clearBtn.addEventListener('click', () => {
        sound.playClick();
        this.clearUserInputs();
      });

      this.revealBtn.addEventListener('click', () => {
        sound.playClick();
        this.revealSolution();
      });

      this.toggleKeypadBtn.addEventListener('click', () => {
        if (this.touchKeypad.style.display === 'none') {
          this.touchKeypad.style.display = 'grid';
          this.toggleKeypadBtn.textContent = 'Hide Keypad ▾';
        } else {
          this.touchKeypad.style.display = 'none';
          this.toggleKeypadBtn.textContent = 'Show Keypad ▴';
        }
      });

      // Keypad button clicks
      this.touchKeypad.querySelectorAll('.key-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const key = btn.getAttribute('data-key');
          this.handleKeypadInput(key);
        });
      });
    }

    pickRandomRange() {
      const ranges = [101, 201, 301, 401, 501, 601, 701, 801, 901];
      // Pick a different range than current
      const otherRanges = ranges.filter(r => r !== this.startNumber);
      const chosen = otherRanges[Math.floor(Math.random() * otherRanges.length)];
      this.startNumber = chosen;
      this.rangeSelect.value = chosen;
      this.buildGrid();
      this.showFeedback(`Random range selected: ${chosen} to ${chosen + 99}! Count down the columns! 🚀`, 'hint');
    }

    buildGrid() {
      const start = this.startNumber;
      const end = start + 99;
      this.rangeTextEl.textContent = `${start} to ${end}`;
      this.gridEl.innerHTML = '';
      this.feedbackEl.className = 'feedback-msg';

      const diff = this.diffSelect.value;
      const clueCoords = this.getClueCoordinates(diff);

      this.cells = [];

      // Grid is 10 rows (r=0..9) x 10 cols (c=0..9).
      // Downwards column order: Number at (c, r) = start + (c * 10) + r
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          const num = start + (c * 10) + r;
          const isClue = clueCoords.has(`${c},${r}`);

          this.cells.push({
            c,
            r,
            num,
            isClue,
            userVal: isClue ? num.toString() : '',
            status: isClue ? 'clue' : 'unfilled'
          });
        }
      }

      // Render cells into 10x10 CSS Grid (row-major order)
      this.cells.forEach((cell, idx) => {
        const cellEl = document.createElement('div');
        cellEl.className = `grid-cell ${cell.isClue ? 'clue' : 'editable'}`;
        cellEl.id = `gridCell_${cell.c}_${cell.r}`;

        if (cell.isClue) {
          cellEl.textContent = cell.num;
        } else {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'grid-cell-input';
          input.maxLength = (cell.num === 1000) ? 4 : 3;
          input.inputMode = 'numeric';
          input.autocomplete = 'off';
          input.setAttribute('data-col', cell.c);
          input.setAttribute('data-row', cell.r);
          input.setAttribute('data-idx', idx);

          input.addEventListener('focus', () => {
            this.setActiveInput(input, cell);
          });

          input.addEventListener('input', (e) => {
            const clean = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = clean;
            cell.userVal = clean;
            this.updateStats();

            sound.playClick();

            const targetLen = (cell.num === 1000) ? 4 : 3;
            if (clean.length === targetLen) {
              // Auto-advance down the column!
              this.moveToNextCell(cell.c, cell.r);
            }
          });

          input.addEventListener('keydown', (e) => {
            this.handleKeydown(e, cell.c, cell.r);
          });

          cellEl.appendChild(input);
        }

        this.gridEl.appendChild(cellEl);
      });

      this.updateStats();
    }

    getClueCoordinates(difficulty) {
      const set = new Set();

      // Core worksheet anchor points:
      // Col 0, Row 0 -> 501
      // Col 1, Row 0 -> 511
      // Col 5, Row 0 -> 551
      // Col 9, Row 0 -> 591
      // Col 0, Row 6 -> 507
      // Col 2, Row 4 -> 525
      // Col 4, Row 8 -> 549
      // Col 7, Row 7 -> 578
      // Col 8, Row 4 -> 585
      // Col 9, Row 9 -> 600
      const worksheetAnchors = [
        [0, 0], [1, 0], [5, 0], [9, 0],
        [0, 6], [2, 4], [4, 8], [7, 7],
        [8, 4], [9, 9]
      ];

      worksheetAnchors.forEach(([c, r]) => set.add(`${c},${r}`));

      if (difficulty === 'worksheet') {
        // Just the worksheet anchors (~10 clues)
        return set;
      }

      // Medium mode: Add ~30 more random clues
      const targetClues = difficulty === 'easy' ? 70 : 40;
      while (set.size < targetClues) {
        const rc = Math.floor(Math.random() * 10);
        const rr = Math.floor(Math.random() * 10);
        set.add(`${rc},${rr}`);
      }

      return set;
    }

    setActiveInput(input, cell) {
      if (this.activeInput) {
        this.activeInput.parentElement.classList.remove('active-focus');
      }
      this.activeInput = input;
      input.parentElement.classList.add('active-focus');
      this.keypadActiveCell.textContent = `Col ${cell.c + 1}, Row ${cell.r + 1}`;
    }

    moveToNextCell(col, row) {
      // Preference: down the column (row + 1), then next column (col + 1, row 0)
      let nextCol = col;
      let nextRow = row + 1;
      if (nextRow > 9) {
        nextRow = 0;
        nextCol = col + 1;
      }
      if (nextCol > 9) nextCol = 0;

      for (let step = 0; step < 100; step++) {
        const targetCell = this.cells.find(c => c.c === nextCol && c.r === nextRow);
        if (targetCell && !targetCell.isClue) {
          const el = document.getElementById(`gridCell_${nextCol}_${nextRow}`);
          const inp = el ? el.querySelector('input') : null;
          if (inp) {
            inp.focus();
            inp.select();
            return;
          }
        }
        nextRow++;
        if (nextRow > 9) {
          nextRow = 0;
          nextCol = (nextCol + 1) % 10;
        }
      }
    }

    handleKeydown(e, col, row) {
      let targetCol = col;
      let targetRow = row;

      if (e.key === 'ArrowDown') {
        targetRow = Math.min(9, row + 1);
      } else if (e.key === 'ArrowUp') {
        targetRow = Math.max(0, row - 1);
      } else if (e.key === 'ArrowRight') {
        targetCol = Math.min(9, col + 1);
      } else if (e.key === 'ArrowLeft') {
        targetCol = Math.max(0, col - 1);
      } else if (e.key === 'Enter') {
        this.moveToNextCell(col, row);
        return;
      } else {
        return;
      }

      e.preventDefault();
      const el = document.getElementById(`gridCell_${targetCol}_${targetRow}`);
      if (el) {
        const inp = el.querySelector('input');
        if (inp) inp.focus();
      }
    }

    handleKeypadInput(key) {
      if (!this.activeInput) {
        // Focus first editable cell
        const first = this.gridEl.querySelector('input');
        if (first) first.focus();
        return;
      }

      sound.playClick();
      const col = parseInt(this.activeInput.getAttribute('data-col'), 10);
      const row = parseInt(this.activeInput.getAttribute('data-row'), 10);
      const cell = this.cells.find(c => c.c === col && c.r === row);

      if (key === 'back') {
        this.activeInput.value = this.activeInput.value.slice(0, -1);
      } else if (key === 'next') {
        this.moveToNextCell(col, row);
        return;
      } else {
        const max = (cell && cell.num === 1000) ? 4 : 3;
        if (this.activeInput.value.length < max) {
          this.activeInput.value += key;
        }
      }

      if (cell) cell.userVal = this.activeInput.value;
      this.updateStats();

      const maxLen = (cell && cell.num === 1000) ? 4 : 3;
      if (this.activeInput.value.length === maxLen) {
        this.moveToNextCell(col, row);
      }
    }

    updateStats() {
      const missingCells = this.cells.filter(c => !c.isClue);
      const filledCells = missingCells.filter(c => c.userVal && c.userVal.trim() !== '');

      this.filledCountEl.textContent = filledCells.length;
      this.totalMissingEl.textContent = missingCells.length;
    }

    checkGrid() {
      const missingCells = this.cells.filter(c => !c.isClue);
      let correct = 0;
      let wrong = 0;

      missingCells.forEach(cell => {
        const cellEl = document.getElementById(`gridCell_${cell.c}_${cell.r}`);
        if (!cellEl) return;

        cellEl.classList.remove('correct-cell', 'wrong-cell', 'hinted-cell');

        const val = parseInt(cell.userVal, 10);
        if (val === cell.num) {
          correct++;
          cellEl.classList.add('correct-cell');
        } else if (cell.userVal !== '') {
          wrong++;
          cellEl.classList.add('wrong-cell');
        }
      });

      if (correct === missingCells.length) {
        showCelebrationModal(
          '100-Grid Champion! 🏆',
          `You completed the entire 100s grid from ${this.startNumber} to ${this.startNumber + 99}!`,
          10,
          () => this.pickRandomRange()
        );
        this.showFeedback('🎉 Perfection! The entire grid is filled accurately!', 'success');
      } else if (wrong > 0) {
        sound.playError();
        this.showFeedback(
          `${correct} of ${missingCells.length} correct. Red boxes need correction! Remember: count down the columns! 💡`,
          'error'
        );
      } else {
        sound.playSuccess();
        this.showFeedback(
          `Great progress! ${correct} correct so far out of ${missingCells.length}. Keep going! 🚀`,
          'hint'
        );
      }
    }

    giveHint() {
      const unfilledOrWrong = this.cells.filter(
        c => !c.isClue && parseInt(c.userVal, 10) !== c.num
      );

      if (unfilledOrWrong.length === 0) {
        this.showFeedback('All cells are already filled correctly! Click "Check My Grid" to finish! 🌟', 'success');
        return;
      }

      // Pick one randomly
      const hintCell = unfilledOrWrong[Math.floor(Math.random() * unfilledOrWrong.length)];
      hintCell.userVal = hintCell.num.toString();

      const cellEl = document.getElementById(`gridCell_${hintCell.c}_${hintCell.r}`);
      if (cellEl) {
        const inp = cellEl.querySelector('input');
        if (inp) {
          inp.value = hintCell.num;
          cellEl.classList.add('hinted-cell');
        }
      }

      this.updateStats();
      this.showFeedback(`Hint given: Box in Col ${hintCell.c + 1}, Row ${hintCell.r + 1} is ${hintCell.num}! ✨`, 'hint');
    }

    clearUserInputs() {
      this.cells.forEach(cell => {
        if (!cell.isClue) {
          cell.userVal = '';
          const cellEl = document.getElementById(`gridCell_${cell.c}_${cell.r}`);
          if (cellEl) {
            cellEl.classList.remove('correct-cell', 'wrong-cell', 'hinted-cell');
            const inp = cellEl.querySelector('input');
            if (inp) inp.value = '';
          }
        }
      });
      this.updateStats();
      this.showFeedback('All answers cleared. Ready for a fresh try! 🧼', 'hint');
    }

    revealSolution() {
      this.cells.forEach(cell => {
        if (!cell.isClue) {
          cell.userVal = cell.num.toString();
          const cellEl = document.getElementById(`gridCell_${cell.c}_${cell.r}`);
          if (cellEl) {
            cellEl.classList.remove('wrong-cell');
            cellEl.classList.add('correct-cell');
            const inp = cellEl.querySelector('input');
            if (inp) inp.value = cell.num;
          }
        }
      });
      this.updateStats();
      this.showFeedback('Full solution revealed! Review how the numbers flow down each column. 📚', 'hint');
    }
  }

  // ==========================================
  // App Initialization & Tab Routing
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    updateStarDisplay();

    // Sound Toggle
    const soundBtn = document.getElementById('soundToggleBtn');
    const soundIcon = document.getElementById('soundIcon');
    if (sound.isMuted) soundIcon.textContent = '🔇';

    soundBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      soundIcon.textContent = isMuted ? '🔇' : '🔊';
    });

    // Help Modal
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const helpCloseBtn = document.getElementById('helpCloseBtn');

    helpBtn.addEventListener('click', () => {
      sound.playClick();
      helpModal.classList.add('show');
    });

    helpCloseBtn.addEventListener('click', () => {
      sound.playClick();
      helpModal.classList.remove('show');
    });

    // Initialize Level Controllers
    const l1 = new Level1Controller();
    const l2 = new Level2Controller();
    const l3 = new Level3Controller();

    // Navigation Tabs
    const tabs = document.querySelectorAll('.level-tab');
    const views = {
      1: document.getElementById('level1'),
      2: document.getElementById('level2'),
      3: document.getElementById('level3')
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        sound.playClick();
        const level = tab.getAttribute('data-level');

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        Object.keys(views).forEach(k => {
          views[k].classList.remove('active');
        });

        if (views[level]) {
          views[level].classList.add('active');
        }

        // When switching to Level 2, re-render lines accurately
        if (level === '2') {
          setTimeout(() => l2.drawLines(), 50);
        }
      });
    });
  });

})();
