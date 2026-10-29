/* Shared bits: nav, footer, "who are you" modal, toasts, scroll effects. */

(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  function ago(t) {
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 60) return "just now";
    const m = Math.round(s / 60); if (m < 60) return m + "m ago";
    const h = Math.round(m / 60); if (h < 24) return h + "h ago";
    const d = Math.round(h / 24); if (d < 30) return d + "d ago";
    return new Date(t).toLocaleDateString();
  }

  const initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const KIND = { alum: "Alumni", current: "Current competitor", pro: "Engineer · Judge" };

  /* ---------- nav + footer ---------- */

  const LINKS = [
    ["index.html", "Home"],
    ["mentors.html", "Mentors"],
    ["board.html", "Board"],
    ["messages.html", "Messages"],
    ["hours.html", "Volunteer hours"],
  ];

  // two offset tiles: one hands off to the next
  const logoSvg = `<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="17" height="17" rx="3" fill="#3d6bff"/><rect x="13" y="13" width="17" height="17" rx="3" fill="none" stroke="#e33b9f" stroke-width="2.5"/></svg>`;

  function renderNav() {
    const host = $("#nav");
    if (!host) return;
    // Vercel serves clean URLs (/mentors), locally it's mentors.html
    let page = location.pathname.split("/").pop() || "index";
    page = page.replace(/\.html$/, "") + ".html";
    host.className = "nav";
    host.innerHTML = `
      <div class="wrap">
        <a class="logo" href="index.html">${logoSvg}<span>FTC Relay</span></a>
        <button class="nav-toggle" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
        <ul class="nav-links">
          ${LINKS.map(([href, label]) => `<li><a href="${href}" ${href === page ? 'aria-current="page"' : ""}>${label}</a></li>`).join("")}
          <li><button class="me-chip" id="meChip"></button></li>
        </ul>
      </div>`;
    const toggle = $(".nav-toggle", host);
    toggle.addEventListener("click", () => {
      const open = $(".nav-links", host).classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    $("#meChip").addEventListener("click", () => askWho());
    paintMe();

    // hide on scroll down, show on scroll up
    let last = scrollY;
    addEventListener("scroll", () => {
      const y = scrollY;
      host.classList.toggle("scrolled", y > 10);
      host.classList.toggle("hide", y > 300 && y > last && !$(".nav-links.open"));
      last = y;
    }, { passive: true });
  }

  function paintMe() {
    const chip = $("#meChip");
    if (!chip) return;
    const me = Store.me();
    chip.textContent = me ? `${me.name}${me.team ? " · " + me.team : ""}` : "Sign in";
  }

  function renderFooter() {
    const host = $("#foot");
    if (!host) return;
    host.innerHTML = `
      <div class="wrap">
        <div class="foot-brand"><a class="logo" href="index.html">${logoSvg}<span>FTC Relay</span></a><p>Mentorship for FIRST Tech Challenge teams, run by a student-led nonprofit.</p><p class="fine">Not affiliated with or endorsed by FIRST®. FIRST Tech Challenge is a trademark of FIRST.</p></div>
        <nav>${LINKS.map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}</nav>
      </div>`;
  }

  /* ---------- identity ---------- */
  // No real auth yet. We just ask for a name + team so posts and bookings have someone attached.

  let pendingResolve = null;

  function buildModal() {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <form class="modal" id="whoForm">
        <h3>Sign in</h3>
        <p>Your name and team number let mentors know who they're working with. This is saved on this device only.</p>
        <div class="field"><label for="whoName">Your name</label><input type="text" id="whoName" required maxlength="40" autocomplete="given-name"></div>
        <div class="form-row">
          <div class="field"><label for="whoTeam">Team #</label><input type="text" id="whoTeam" placeholder="#12345" maxlength="12"></div>
          <div class="field"><label for="whoRole">I'm a…</label>
            <select id="whoRole"><option value="student">Student on a team</option><option value="mentor">Mentor</option><option value="coach">Coach / parent</option></select>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
          <button type="button" class="btn ghost small" id="whoCancel">Cancel</button>
          <button class="btn small">Save</button>
        </div>
      </form>`;
    document.body.appendChild(back);
    const close = (val) => { back.classList.remove("open"); pendingResolve?.(val); pendingResolve = null; };
    $("#whoCancel", back).addEventListener("click", () => close(null));
    back.addEventListener("click", (e) => { if (e.target === back) close(null); });
    $("#whoForm", back).addEventListener("submit", (e) => {
      e.preventDefault();
      let team = $("#whoTeam").value.trim();
      if (team && !team.startsWith("#")) team = "#" + team;
      const prev = Store.me();
      const me = { id: prev?.id || Store.uid(), name: $("#whoName").value.trim(), team, role: $("#whoRole").value };
      Store.setMe(me);
      paintMe();
      toast(`Signed in as ${me.name}.`);
      close(me);
    });
    return back;
  }

  function askWho() {
    const back = $(".modal-back") || buildModal();
    const me = Store.me();
    $("#whoName").value = me?.name || "";
    $("#whoTeam").value = me?.team || "";
    $("#whoRole").value = me?.role || "student";
    back.classList.add("open");
    setTimeout(() => $("#whoName").focus(), 50);
    return new Promise((r) => { pendingResolve = r; });
  }

  // resolves with the current user, prompting if needed
  async function requireMe() {
    return Store.me() || (await askWho());
  }

  /* ---------- toast ---------- */

  let toastTimer;
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
  }

  /* ---------- scroll effects ---------- */

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.dataset.count != null) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  function observe(root = document) {
    $$("[data-reveal], .split, [data-count], .quote-big", root).forEach((el) => io.observe(el));
  }

  function countUp(el) {
    const to = parseFloat(el.dataset.count);
    if (reduced) { el.textContent = to; return; }
    const dur = 1400, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // wraps each line of a heading (marked with <br>) in a mask for the slide-up reveal
  function splitLines() {
    $$("[data-split]").forEach((el) => {
      const parts = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = parts.map((p, i) => `<span class="split-line"><span style="--i:${i}">${p}</span></span>`).join("");
      el.classList.add("split");
    });
  }

  function avatar(m, cls = "") {
    return `<div class="avatar ${cls}" style="--av:${m.color || "#17140f"}" aria-hidden="true">${esc(initials(m.name))}</div>`;
  }

  function voteMeter(s) {
    if (!s.total) return `<span class="muted">No feedback yet</span>`;
    return `<span class="vote-meter"><span class="bar"><i style="width:${s.pct}%"></i></span>${s.pct}% positive · ${s.total} reviews</span>`;
  }

  // profile card used on the home page and the mentor directory
  function mentorCard(m, i = 0) {
    const s = Store.score(m.id);
    return `
      <button class="icard" data-id="${m.id}" data-reveal style="--i:${i % 3}">
        <div class="icard-top">
          ${avatar(m)}
          <div class="icard-id"><h3>${esc(m.name)}</h3><div class="team">${esc(m.team)}</div></div>
        </div>
        <p class="blurb">${esc(m.blurb)}</p>
        <div class="tags"><span class="kind-stamp ${m.kind}">${KIND[m.kind]}</span>${m.specialties.map((t) => `<span class="pill">${esc(t)}</span>`).join("")}</div>
        <div class="icard-foot">${voteMeter(s)}<span>${m.years} seasons · ${m.slots.length} open slots</span></div>
      </button>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderNav();
    renderFooter();
    splitLines();
    observe();
  });

  window.UI = { $, $$, esc, ago, initials, KIND, toast, requireMe, askWho, observe, avatar, voteMeter, paintMe, mentorCard };
})();
