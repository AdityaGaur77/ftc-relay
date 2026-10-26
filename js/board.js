/* Community board: threads, replies, upvotes. */

(function () {
  const { $, $$, esc, ago } = UI;
  const CATS = ["Programming", "Hardware", "CAD", "Strategy", "Outreach", "Season Q&A", "Off-topic"];
  const state = { cat: "", sort: "new", open: new Set() };

  const up = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>`;

  document.addEventListener("DOMContentLoaded", () => {
    $("#pCat").innerHTML = CATS.map((c) => `<option>${c}</option>`).join("");

    $("#cats").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      state.cat = b.dataset.cat;
      render();
    });
    $("#sorts").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      state.sort = b.dataset.sort;
      $$("#sorts button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      render();
    });

    $("#newPostBtn").addEventListener("click", async () => {
      if (!(await UI.requireMe())) return;
      $("#composer").hidden = false;
      $("#composer").scrollIntoView({ behavior: "smooth", block: "center" });
      $("#pTitle").focus({ preventScroll: true });
    });
    $("#cancelPost").addEventListener("click", () => { $("#composer").hidden = true; $("#composer").reset(); });
    $("#composer").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!(await UI.requireMe())) return;
      Store.addPost({ title: $("#pTitle").value.trim(), body: $("#pBody").value.trim(), cat: $("#pCat").value });
      $("#composer").reset();
      $("#composer").hidden = true;
      state.cat = "";
      state.sort = "new";
      $$("#sorts button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.sort === "new"));
      state.open.add(Store.posts()[0].id);
      render();
      UI.toast("Posted.");
    });

    $("#threads").addEventListener("click", onThreadClick);
    $("#threads").addEventListener("submit", onReply);

    const hash = location.hash.slice(1);
    if (hash) state.open.add(hash);
    render();
    if (hash) setTimeout(() => document.getElementById("t-" + hash)?.scrollIntoView({ block: "center" }), 100);
  });

  function render() {
    const posts = Store.posts();
    const counts = Object.fromEntries(CATS.map((c) => [c, posts.filter((p) => p.cat === c).length]));
    $("#cats").innerHTML = [["", "Everything", posts.length], ...CATS.map((c) => [c, c, counts[c]])]
      .map(([v, l, n]) => `<button data-cat="${v}" aria-pressed="${state.cat === v}"><span>${l}</span><span class="n">${n}</span></button>`).join("");

    const sorts = {
      new: (a, b) => b.at - a.at,
      top: (a, b) => b.votes - a.votes,
      active: (a, b) => b.replies.length - a.replies.length,
    };
    const list = posts.filter((p) => !state.cat || p.cat === state.cat).sort(sorts[state.sort]);

    $("#threads").innerHTML = list.map((p, i) => `
      <article class="thread ${state.open.has(p.id) ? "open" : ""}" id="t-${p.id}" data-id="${p.id}" data-reveal style="--i:${Math.min(i, 4)}">
        <div class="thread-head" role="button" tabindex="0" aria-expanded="${state.open.has(p.id)}">
          <button class="upv" aria-pressed="${!!p.voted}" aria-label="Upvote" data-vote>${up}<span>${p.votes}</span></button>
          <div>
            <h3>${esc(p.title)}</h3>
            <div class="meta"><span class="pill">${esc(p.cat)}</span><span>${esc(p.by)} ${esc(p.team || "")}${p.mentor ? " · mentor" : ""}</span><span>${ago(p.at)}</span></div>
          </div>
          <div class="thread-count">${p.replies.length}<small>replies</small></div>
        </div>
        <div class="thread-body">
          <p class="op">${esc(p.body)}</p>
          ${p.replies.map((r) => `
            <div class="reply ${r.mentor ? "mentor" : ""}">
              <div class="meta">${esc(r.by)} ${esc(r.team || "")}${r.mentor ? " · <b style='color:var(--accent)'>mentor</b>" : ""} · ${ago(r.at)}</div>
              <p>${esc(r.body)}</p>
            </div>`).join("")}
          <form class="reply-form">
            <label class="sr-only" for="r-${p.id}">Reply</label>
            <textarea id="r-${p.id}" required maxlength="2000" placeholder="Write a reply…"></textarea>
            <button class="btn small">Reply</button>
          </form>
        </div>
      </article>`).join("");
    $("#empty").hidden = list.length > 0;
    UI.observe($("#threads"));
  }

  function onThreadClick(e) {
    const t = e.target.closest(".thread");
    if (!t) return;
    const id = t.dataset.id;
    if (e.target.closest("[data-vote]")) {
      const p = Store.vote(id);
      const b = e.target.closest("[data-vote]");
      b.setAttribute("aria-pressed", !!p.voted);
      $("span", b).textContent = p.votes;
      return;
    }
    if (!e.target.closest(".thread-head")) return;
    const open = t.classList.toggle("open");
    $(".thread-head", t).setAttribute("aria-expanded", open);
    open ? state.open.add(id) : state.open.delete(id);
  }

  async function onReply(e) {
    e.preventDefault();
    if (!(await UI.requireMe())) return;
    const t = e.target.closest(".thread");
    const body = $("textarea", e.target).value.trim();
    if (!body) return;
    Store.reply(t.dataset.id, body);
    render();
    // keep the thread visible without replaying its entrance animation
    $$("#threads [data-reveal]").forEach((el) => el.classList.add("in"));
  }

  // keyboard support for the thread header
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("thread-head")) {
      e.preventDefault();
      e.target.click();
    }
  });
})();
