document.addEventListener("DOMContentLoaded", () => {
  let announcerVoice = null;
  function pickAnnouncerVoice() {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const preferredNames = [
      "Google UK English Male",
      "Microsoft Guy Online (Natural) - English (United States)",
      "Microsoft Ryan Online (Natural) - English (United Kingdom)",
      "Microsoft David - English (United States)",
      "Google US English",
      "Daniel",
      "Alex",
      "Fred",
    ];
    for (const name of preferredNames) {
      const match = voices.find((v) => v.name === name);
      if (match) return match;
    }
    return (
      voices.find((v) => v.lang?.startsWith("en") && v.localService) ||
      voices.find((v) => v.lang?.startsWith("en")) ||
      voices[0]
    );
  }
  if ("speechSynthesis" in window) {
    announcerVoice = pickAnnouncerVoice();
    window.speechSynthesis.onvoiceschanged = () => {
      announcerVoice = pickAnnouncerVoice();
    };
  }

  function speak(text, opts = {}) {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = opts.rate ?? 1.08;
    utter.pitch = opts.pitch ?? 1.2;
    utter.volume = opts.volume ?? 1;
    if (announcerVoice) utter.voice = announcerVoice;
    window.speechSynthesis.speak(utter);
  }

  function announce(text, opts) {
    speak(text, opts);
  }

  function announceNow(text, opts) {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speak(text, opts);
  }

  let hasWelcomed = false;
  function welcomeAnnouncement() {
    if (hasWelcomed) return;
    hasWelcomed = true;
    announceNow("Welcooooome... to the Boat Olympics!", { pitch: 1.25, rate: 1.05 });
  }
  ["pointerdown", "keydown", "scroll"].forEach((evt) =>
    document.addEventListener(evt, welcomeAnnouncement, { once: true, passive: true })
  );

  const revealTargets = document.querySelectorAll(".game-card, .timeline-item, .fleet-card");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach((el) => observer.observe(el));

  document.querySelectorAll(".game-card[data-event]").forEach((card, i) => {
    const gameNum = i + 1;
    const title = card.querySelector("h3").textContent;
    let lastAnnounced = 0;
    function announceGame() {
      const now = Date.now();
      if (now - lastAnnounced < 500) return;
      lastAnnounced = now;
      announceNow(`Game ${gameNum}! ${title}!`, { pitch: 1.25, rate: 1.1 });
    }
    card.addEventListener("mouseenter", announceGame);
    card.addEventListener("click", (e) => {
      if (e.target.closest(".vote-btn")) return;
      announceGame();
    });
  });

  const audio = document.getElementById("bgAudio");
  const toggle = document.getElementById("audioToggle");
  const iconPlay = document.getElementById("iconPlay");
  const iconPause = document.getElementById("iconPause");

  const tryPlay = () => audio.play().catch(() => {});

  tryPlay();

  const resumeOnInteraction = () => {
    if (audio.paused) tryPlay();
    document.removeEventListener("pointerdown", resumeOnInteraction);
    document.removeEventListener("keydown", resumeOnInteraction);
  };
  document.addEventListener("pointerdown", resumeOnInteraction, { once: true });
  document.addEventListener("keydown", resumeOnInteraction, { once: true });

  toggle.addEventListener("click", () => {
    if (audio.paused) {
      tryPlay();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => {
    toggle.classList.add("playing");
    iconPlay.hidden = true;
    iconPause.hidden = false;
  });

  audio.addEventListener("pause", () => {
    toggle.classList.remove("playing");
    iconPlay.hidden = false;
    iconPause.hidden = true;
  });

  const navBurger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");

  navBurger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navBurger.setAttribute("aria-expanded", String(isOpen));
    playMenuClick();
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navBurger.setAttribute("aria-expanded", "false");
    });
  });

  let audioCtx;
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function tone(ctx, freq, startTime, duration, type, peakGain) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  function playPointSound(boat) {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const base = boat === "port" ? 523.25 : 659.25;
    tone(ctx, base, now, 0.16, "triangle", 0.22);
    tone(ctx, base * 1.5, now + 0.08, 0.2, "triangle", 0.18);
  }

  function playUndoSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    tone(ctx, 440, now, 0.12, "sine", 0.15);
    tone(ctx, 300, now + 0.07, 0.16, "sine", 0.12);
  }

  function playFanfare() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => tone(ctx, freq, now + i * 0.16, 0.35, "sawtooth", 0.2));
    tone(ctx, 1046.5, now + notes.length * 0.16, 0.7, "sawtooth", 0.22);
  }

  function playMenuClick() {
    const ctx = getAudioCtx();
    tone(ctx, 660, ctx.currentTime, 0.08, "sine", 0.12);
  }

  const STORAGE_KEY = "boatOlympicScores";
  const cards = document.querySelectorAll(".game-card[data-event]");
  const totalEvents = cards.length;

  const loadScores = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  };
  let scores = loadScores();
  const saveScores = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));

  const scorePort = document.getElementById("scorePort");
  const scoreStarboard = document.getElementById("scoreStarboard");
  const scoreBarPort = document.getElementById("scoreBarPort");
  const scoreBarStarboard = document.getElementById("scoreBarStarboard");
  const scoreTally = document.getElementById("scoreTally");
  const scoreBanner = document.getElementById("scoreBanner");
  const confettiField = document.getElementById("confettiField");
  const medalPort = document.getElementById("medalPort");
  const medalStarboard = document.getElementById("medalStarboard");

  const TEAM_NAME = { port: "Juju's", starboard: "Nori's" };

  const BANNERS = {
    tiePlaying: "All square. Let's sail.",
    tieDecided: (n) => `Dead heat — ${n} down, tied on points.`,
    lead: (leader, margin) => `${leader} leads by ${margin}${margin === 1 ? " point" : " points"}.`,
    done: (leader) => `${leader} takes the Cup!`,
  };

  function confettiBurst() {
    const colors = ["#c9a24b", "#c1443c", "#2f8f5b"];
    for (let i = 0; i < 22; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = `${0.9 + Math.random() * 0.6}s`;
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      confettiField.appendChild(piece);
      piece.addEventListener("animationend", () => piece.remove());
    }
  }

  let cupCelebrated = false;

  function render(justChanged) {
    let port = 0;
    let starboard = 0;
    cards.forEach((card) => {
      const event = card.dataset.event;
      const winner = scores[event];
      const ribbon = card.querySelector(".game-winner");
      card.classList.remove("won-port", "won-starboard", "is-won");
      card.querySelectorAll(".vote-btn").forEach((btn) => btn.classList.remove("active"));

      if (winner === "port") port++;
      if (winner === "starboard") starboard++;

      if (winner) {
        card.classList.add("is-won", `won-${winner}`);
        card.querySelector(`.vote-btn[data-boat="${winner}"]`).classList.add("active");
        ribbon.hidden = false;
        ribbon.textContent = `Won by ${TEAM_NAME[winner]}`;
        ribbon.className = `game-winner winner-${winner}`;
      } else {
        ribbon.hidden = true;
      }
    });

    const decided = port + starboard;
    scorePort.textContent = port;
    scoreStarboard.textContent = starboard;
    scoreTally.textContent = `${decided} of ${totalEvents} events decided`;

    const portPct = decided ? (port / totalEvents) * 100 : 0;
    const starboardPct = decided ? (starboard / totalEvents) * 100 : 0;
    scoreBarPort.style.width = `${portPct}%`;
    scoreBarStarboard.style.width = `${starboardPct}%`;

    medalPort.textContent = "";
    medalStarboard.textContent = "";
    if (decided > 0 && port !== starboard) {
      (port > starboard ? medalPort : medalStarboard).textContent = "🥇";
      (port > starboard ? medalStarboard : medalPort).textContent = "🥈";
    }

    const cupDone = decided === totalEvents && port !== starboard;

    if (decided === 0) {
      scoreBanner.textContent = BANNERS.tiePlaying;
    } else if (cupDone) {
      scoreBanner.textContent = BANNERS.done(port > starboard ? TEAM_NAME.port : TEAM_NAME.starboard);
    } else if (port === starboard) {
      scoreBanner.textContent = BANNERS.tieDecided(decided);
    } else {
      scoreBanner.textContent = BANNERS.lead(port > starboard ? TEAM_NAME.port : TEAM_NAME.starboard, Math.abs(port - starboard));
    }

    if (cupDone && justChanged && !cupCelebrated) {
      cupCelebrated = true;
      playFanfare();
      announceNow(`${port > starboard ? TEAM_NAME.port : TEAM_NAME.starboard}... wiiiins, the Boat Olympics!`, { pitch: 1.3, rate: 1.12 });
    } else if (!cupDone) {
      cupCelebrated = false;
    }

    if (justChanged) {
      scoreBanner.classList.remove("score-banner");
      void scoreBanner.offsetWidth;
      scoreBanner.classList.add("score-banner");
      [scorePort, scoreStarboard].forEach((el) => {
        el.classList.remove("bump");
        void el.offsetWidth;
        el.classList.add("bump");
      });
      confettiBurst();
    }
  }

  cards.forEach((card) => {
    const event = card.dataset.event;
    card.querySelectorAll(".vote-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const boat = btn.dataset.boat;
        const wasSet = scores[event] === boat;
        if (wasSet) {
          delete scores[event];
          playUndoSound();
        } else {
          scores[event] = boat;
          playPointSound(boat);
          announceNow(`Poooooint, ${TEAM_NAME[boat]}!`, { pitch: 1.28, rate: 1.15 });
        }
        saveScores();
        render(true);
      });
    });
  });

  document.getElementById("scoreReset").addEventListener("click", () => {
    if (confirm("Reset the entire Cup? This clears every recorded win.")) {
      scores = {};
      saveScores();
      render(false);
    }
  });

  render(false);
});
