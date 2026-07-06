document.addEventListener("DOMContentLoaded", () => {
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
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navBurger.setAttribute("aria-expanded", "false");
    });
  });

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
        ribbon.textContent = `Won by ${winner === "port" ? "Port" : "Starboard"}`;
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

    if (decided === 0) {
      scoreBanner.textContent = BANNERS.tiePlaying;
    } else if (decided === totalEvents && port !== starboard) {
      scoreBanner.textContent = BANNERS.done(port > starboard ? "Port" : "Starboard");
    } else if (port === starboard) {
      scoreBanner.textContent = BANNERS.tieDecided(decided);
    } else {
      scoreBanner.textContent = BANNERS.lead(port > starboard ? "Port" : "Starboard", Math.abs(port - starboard));
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
        scores[event] = scores[event] === boat ? undefined : boat;
        if (scores[event] === undefined) delete scores[event];
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
