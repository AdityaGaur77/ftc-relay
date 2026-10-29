/* Mentor directory + profile drawer (bio, booking, feedback). */

(function () {
  const { $, $$, esc, ago, KIND } = UI;

  const state = { q: "", tags: new Set(), kind: "", sort: "fb" };

  const thumb = (up) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${up ? "" : 'style="transform:scaleY(-1)"'}><path d="M7 10v11H3V10h4zm0 0l4-8c1.7 0 3 1.3 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7"/></svg>`;

  document.addEventListener("DOMContentLoaded", () => {
    $("#chips").innerHTML = Store.SPECIALTIES.map((s) => `<button class="chip" aria-pressed="false" data-tag="${s}">${s}</button>`).join("");
    $("#chips").addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", on);
      on ? state.tags.add(b.dataset.tag) : state.tags.delete(b.dataset.tag);
      render();
    });
    $("#q").addEventListener("input", (e) => { state.q = e.target.value.toLowerCase(); render(); });
    $("#kind").addEventListener("change", (e) => { state.kind = e.target.value; render(); });
    $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });

    $("#grid").addEventListener("click", (e) => {
      const c = e.target.closest(".icard");
      if (c) location.hash = c.dataset.id;
    });
    $("#drawerClose").addEventListener("click", closeDrawer);
    $("#drawerBack").addEventListener("click", closeDrawer);
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
    addEventListener("hashchange", route);

    $("#count").textContent = Store.mentors().length;
    $("#slotCount").textContent = Store.mentors().reduce((n, m) => n + m.slots.length, 0) - Store.bookings().length;

    render();
    route();
  });

  function render() {
    let list = Store.mentors().filter((m) => {
      if (state.kind && m.kind !== state.kind) return false;
      if (state.tags.size && ![...state.tags].every((t) => m.specialties.includes(t))) return false;
      if (state.q) {
        const hay = [m.name, m.team, m.blurb, m.bio, ...m.specialties].join(" ").toLowerCase();
        if (!hay.includes(state.q)) return false;
      }
      return true;
    });
    const by = {
      fb: (a, b) => (Store.score(b.id).pct ?? -1) - (Store.score(a.id).pct ?? -1) || Store.score(b.id).total - Store.score(a.id).total,
      years: (a, b) => b.years - a.years,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    list.sort(by[state.sort]);
    $("#grid").innerHTML = list.map((m, i) => UI.mentorCard(m, i)).join("");
    $("#empty").hidden = list.length > 0;
    UI.observe($("#grid"));
  }

  /* ---------- drawer ---------- */

  function route() {
    const id = location.hash.slice(1);
    const m = Store.mentor(id);
    if (m) openDrawer(m);
    else hideDrawer();
  }

  function closeDrawer() {
    if (location.hash) history.pushState("", document.title, location.pathname + location.search);
    hideDrawer();
  }

  function hideDrawer() {
    $("#drawer").classList.remove("open");
    $("#drawerBack").classList.remove("open");
    $("#drawer").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openDrawer(m) {
    paintProfile(m);
    $("#drawer").classList.add("open");
    $("#drawerBack").classList.add("open");
    $("#drawer").setAttribute("aria-hidden", "false");
    $("#drawer").scrollTop = 0;
    document.body.style.overflow = "hidden";
  }

  function paintProfile(m) {
    const s = Store.score(m.id);
    const taken = new Set(Store.bookingsFor(m.id).map((b) => b.slot));
    const fb = Store.feedbackFor(m.id);
    const mine = Store.myFeedback(m.id);
    const canReview = Store.hasBookedWith(m.id);
    const myBookings = Store.bookingsFor(m.id).filter((b) => b.byId === Store.me()?.id);

    $("#drawerBody").innerHTML = `
      <div class="profile-head">
        ${UI.avatar(m, "lg")}
        <div>
          <span class="kind-stamp ${m.kind}">${KIND[m.kind]}</span>
          <h2 style="margin-top:8px">${esc(m.name)}</h2>
          <div class="mono muted">${esc(m.team)} · ${m.years} seasons</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">${m.specialties.map((t) => `<span class="pill">${esc(t)}</span>`).join("")}</div>
      <p style="font-size:1.05rem">${esc(m.bio)}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px">
        <a class="btn small" href="#book-${m.id}" id="jumpBook">Book a call</a>
        <a class="btn small ghost" href="messages.html?to=${m.id}">Message ${esc(m.name.split(" ")[0])}</a>
      </div>

      <div class="profile-sec">
        <span class="lbl">Experience</span>
        <ul class="timeline">${m.experience.map(([y, t]) => `<li><span>${esc(y)}</span><span>${esc(t)}</span></li>`).join("")}</ul>
      </div>

      <div class="profile-sec" id="book-${m.id}">
        <span class="lbl">Book a call</span>
        ${myBookings.length ? `<div class="notice soft">You're booked: ${myBookings.map((b) => `<b>${esc(b.slot)}</b>`).join(", ")}. ${esc(m.name.split(" ")[0])} will send a call link in Messages.</div>` : ""}
        <form id="bookForm">
          <div class="slots" role="group" aria-label="Open times">
            ${m.slots.map((sl) => `<button type="button" class="slot ${taken.has(sl) ? "taken" : ""}" aria-pressed="false" data-slot="${esc(sl)}">${esc(sl)}</button>`).join("")}
          </div>
          <div class="field">
            <label for="topic">What do you want help with?</label>
            <textarea id="topic" required maxlength="600" placeholder="e.g. Our autonomous drifts left on long moves. We use Road Runner 1.0."></textarea>
          </div>
          <div class="notice">
            <label class="check"><input type="checkbox" id="recConsent" required>
              <span>I agree that this session will be recorded. Recordings are reviewed by the nonprofit to verify mentor volunteer hours and are not shared publicly.</span>
            </label>
          </div>
          <button class="btn" id="bookBtn" disabled>Book it <span class="arrow">→</span></button>
        </form>
      </div>

      <div class="profile-sec">
        <span class="lbl">What teams said</span>
        <div class="fb-summary">
          ${s.total
            ? `<div class="split-bar" aria-hidden="true"><i style="width:${s.pct}%"></i><b style="flex:1"></b></div>
               <div class="mono"><b style="color:var(--green)">${s.pos} helped</b> · <b style="color:var(--red)">${s.neg} didn't</b></div>`
            : `<span class="muted">No feedback yet.</span>`}
        </div>
        <ul class="fb-list">
          ${fb.map((f) => `
            <li>
              <div class="who-line"><span class="fb-mark ${f.positive ? "pos" : "neg"}">${f.positive ? "HELPED" : "DIDN'T HELP"}</span>${esc(f.by)} · ${ago(f.at)}</div>
              ${f.note ? `<div>${esc(f.note)}</div>` : ""}
            </li>`).join("")}
        </ul>

        ${canReview
          ? `<form id="fbForm">
              <span class="lbl" style="display:block;margin-bottom:10px">${mine ? "Update your feedback" : "Did it help?"}</span>
              <div class="verdict">
                <button type="button" class="pos" aria-pressed="${mine?.positive === true}">${thumb(true)} Helped</button>
                <button type="button" class="neg" aria-pressed="${mine?.positive === false}">${thumb(false)} Didn't help</button>
              </div>
              <div class="field"><label for="fbNote">Comment (optional)</label><textarea id="fbNote" maxlength="400" placeholder="What was most useful, or what could be better?">${esc(mine?.note || "")}</textarea></div>
              <label class="check" style="margin-bottom:14px"><input type="checkbox" id="fbAnon" ${mine?.by === "anonymous" ? "checked" : ""}> Post without my name</label>
              <button class="btn small" id="fbBtn" ${mine ? "" : "disabled"}>${mine ? "Update" : "Post feedback"}</button>
            </form>`
          : `<div class="notice soft">Only teams who've booked a session with ${esc(m.name.split(" ")[0])} can leave feedback.</div>`}
      </div>`;

    wireBooking(m);
    if (canReview) wireFeedback(m, mine);
    $("#jumpBook").addEventListener("click", (e) => {
      e.preventDefault();
      $(`#book-${m.id}`).scrollIntoView({ behavior: "smooth" });
    });
  }

  function wireBooking(m) {
    let slot = null;
    const btn = $("#bookBtn");
    const check = () => (btn.disabled = !(slot && $("#topic").value.trim() && $("#recConsent").checked));
    $$(".slot").forEach((b) => b.addEventListener("click", () => {
      $$(".slot").forEach((x) => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      slot = b.dataset.slot;
      check();
    }));
    $("#topic").addEventListener("input", check);
    $("#recConsent").addEventListener("change", check);

    $("#bookForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const me = await UI.requireMe();
      if (!me) return;
      Store.book({ mentor: m.id, slot, topic: $("#topic").value.trim(), byId: me.id, by: me.name, team: me.team });
      Store.send(m.id, `Hi! I just booked ${slot}. Here is what we need help with:\n\n${$("#topic").value.trim()}`);
      UI.toast(`Session booked with ${m.name.split(" ")[0]} for ${slot}.`);
      paintProfile(m);
      render();
    });
  }

  function wireFeedback(m, mine) {
    let verdict = mine ? mine.positive : null;
    const pos = $("#fbForm .pos"), neg = $("#fbForm .neg");
    const pick = (v) => {
      verdict = v;
      pos.setAttribute("aria-pressed", v === true);
      neg.setAttribute("aria-pressed", v === false);
      $("#fbBtn").disabled = false;
    };
    pos.addEventListener("click", () => pick(true));
    neg.addEventListener("click", () => pick(false));
    $("#fbForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (verdict == null) return;
      Store.leaveFeedback(m.id, verdict, $("#fbNote").value, $("#fbAnon").checked);
      UI.toast("Feedback posted.");
      paintProfile(m);
      render();
    });
  }
})();
