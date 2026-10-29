/* Home page: mentor + board previews, scroll-driven bits. */

(function () {
  const { $, $$, esc, ago } = UI;

  document.addEventListener("DOMContentLoaded", () => {
    // three mentor cards
    const picks = ["maya", "arjun", "sofia"].map(Store.mentor);
    $("#homeMentors").innerHTML = picks.map((m, i) => UI.mentorCard(m, i)).join("");
    $$("#homeMentors .icard").forEach((c) => c.addEventListener("click", () => (location.href = `mentors.html#${c.dataset.id}`)));

    // three most active threads
    const posts = [...Store.posts()].sort((a, b) => b.votes - a.votes).slice(0, 3);
    $("#homeBoard").innerHTML = posts.map((p, i) => `
      <a href="board.html#${p.id}" data-reveal style="--i:${i}">
        <span class="pill">${esc(p.cat)}</span>
        <h4>${esc(p.title)}</h4>
        <div class="meta">${esc(p.by)} ${esc(p.team || "")} · ${p.replies.length} ${p.replies.length === 1 ? "reply" : "replies"} · ${ago(p.at)}</div>
      </a>`).join("");

    // hero preview uses a real profile
    const m = Store.mentor("maya");
    $("#pvHead").innerHTML = `${UI.avatar(m)}<div style="flex:1;min-width:0"><h4>${esc(m.name)}</h4><div class="mono muted">${esc(m.team)}</div></div>`;
    $("#pvBlurb").textContent = m.blurb;
    $("#pvSlots").innerHTML = m.slots.map((s, i) => `<span class="${i === 1 ? "on" : ""}">${esc(s)}</span>`).join("");

    // stats from the same data the directory uses
    const all = Store.mentors();
    const fb = all.map((x) => Store.score(x.id));
    const pos = fb.reduce((n, x) => n + x.pos, 0), tot = fb.reduce((n, x) => n + x.total, 0);
    $("#stMentors").dataset.count = all.length;
    $("#stSeasons").dataset.count = all.reduce((n, x) => n + x.years, 0);
    $("#stPos").dataset.count = tot ? Math.round((pos / tot) * 100) : 0;

    UI.observe($("main"));
    initSteps();
    initScroll();
  });

  // the big number on the left rolls to whichever step is in the middle of the screen
  function initSteps() {
    const steps = $$(".step");
    const roll = $(".big-num .roll");
    const label = $("#stepLabel");
    const bar = $(".steps-progress i");
    const set = (i) => {
      steps.forEach((s, j) => s.classList.toggle("active", j === i));
      roll.style.transform = `translateY(${-i * 0.82}em)`;
      label.textContent = steps[i].dataset.label;
      bar.style.transform = `scaleX(${(i + 1) / steps.length})`;
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) set(steps.indexOf(e.target)); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => io.observe(s));
  }

  function initScroll() {
    const track = $(".track");
    const movers = $$("[data-speed]");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ticking = false;

    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      track.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : 0);
      if (!reduced) {
        // `translate` composes with the reveal transform instead of replacing it
        movers.forEach((el) => (el.style.translate = `0 ${(scrollY * el.dataset.speed).toFixed(1)}px`));
      }
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
})();
