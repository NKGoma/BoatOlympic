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

  toggle.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {
        console.warn("Add your track at assets/audio/track.mp3 to enable background music.");
      });
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
});
