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
});
