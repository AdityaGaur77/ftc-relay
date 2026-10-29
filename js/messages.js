/* Direct messages with mentors. */

(function () {
  const { $, $$, esc, ago } = UI;
  let current = null;

  document.addEventListener("DOMContentLoaded", () => {
    const to = new URLSearchParams(location.search).get("to");
    if (to && Store.mentor(to)) Store.openThread(to);

    $("#newTo").innerHTML += Store.mentors().map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("");
    $("#newTo").addEventListener("change", (e) => {
      if (!e.target.value) return;
      Store.openThread(e.target.value);
      open(e.target.value);
      e.target.value = "";
    });

    $("#convos").addEventListener("click", (e) => {
      const b = e.target.closest(".convo");
      if (b) open(b.dataset.id);
    });

    renderList();
    const first = to && Store.mentor(to) ? to : innerWidth > 760 ? sortedIds()[0] : null;
    if (first) open(first);
  });

  const sortedIds = () => {
    const t = Store.threads();
    const last = (id) => t[id].at(-1)?.at ?? Infinity; // empty (just opened) threads float to the top
    return Object.keys(t).filter(Store.mentor).sort((a, b) => last(b) - last(a));
  };

  function renderList() {
    const t = Store.threads();
    const ids = sortedIds();
    $("#convos").innerHTML = ids.length
      ? ids.map((id) => {
          const m = Store.mentor(id);
          const last = t[id].at(-1);
          return `<button class="convo" data-id="${id}" aria-current="${id === current}">
            ${UI.avatar(m)}
            <div><div class="nm">${esc(m.name)}</div><div class="last">${last ? (last.from === "me" ? "You: " : "") + esc(last.text) : "<i>new conversation</i>"}</div></div>
          </button>`;
        }).join("")
      : `<p class="muted" style="padding:0 16px;font-size:.9rem">No messages yet. Start one below, or hit "Message" on any mentor's profile.</p>`;
  }

  function open(id) {
    current = id;
    const m = Store.mentor(id);
    $("#inbox").classList.add("chatting");
    $("#chat").innerHTML = `
      <div class="chat-head">
        <button class="back" aria-label="Back to conversations">←</button>
        ${UI.avatar(m)}
        <div><div style="font-weight:600">${esc(m.name)}</div><div class="mono muted">${esc(m.team)}</div></div>
        <a class="btn small ghost" style="margin-left:auto" href="mentors.html#${m.id}">Profile</a>
      </div>
      <div class="chat-log" id="log"></div>
      <form class="chat-form" id="chatForm">
        <label class="sr-only" for="msg">Message</label>
        <input type="text" id="msg" autocomplete="off" maxlength="1000" placeholder="Write to ${esc(m.name.split(" ")[0])}…">
        <button class="btn small">Send</button>
      </form>`;
    $(".back").addEventListener("click", () => { $("#inbox").classList.remove("chatting"); current = null; renderList(); });
    $("#chatForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = $("#msg").value.trim();
      if (!text || !(await UI.requireMe())) return;
      Store.send(id, text);
      $("#msg").value = "";
      paintLog();
      renderList();
    });
    paintLog();
    renderList();
    if (innerWidth > 760) $("#msg").focus();
  }

  function paintLog() {
    const msgs = Store.threads()[current] || [];
    const m = Store.mentor(current);
    $("#log").innerHTML = msgs.length
      ? msgs.map((x) => `<div class="bubble ${x.from === "me" ? "me" : "them"}">${esc(x.text)}<time>${ago(x.at)}</time></div>`).join("")
      : `<div class="chat-empty">Start the conversation with ${esc(m.name.split(" ")[0])}. Include your team number and what you need help with.</div>`;
    $("#log").scrollTop = $("#log").scrollHeight;
  }
})();
