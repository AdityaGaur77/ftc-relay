/* Volunteer hours: rules, cap meter, session log. */

(function () {
  const { $, $$, esc } = UI;
  const { capPerSeason, maxPerSession, season } = Store.HOURS;

  document.addEventListener("DOMContentLoaded", () => {
    $$(".js-cap").forEach((el) => (el.textContent = capPerSeason));
    $$(".js-per").forEach((el) => (el.textContent = maxPerSession));
    $$(".js-season").forEach((el) => (el.textContent = season));
    $("#hHours").max = maxPerSession;
    $("#hDate").max = new Date().toISOString().slice(0, 10);

    $("#logForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const me = await UI.requireMe();
      if (!me) return;
      const hours = parseFloat($("#hHours").value);
      const { left } = Store.hoursTotals();
      if (hours > left) {
        UI.toast(left ? `You only have ${left} hours left this season.` : "You've hit the cap for this season.");
        return;
      }
      let team = $("#hTeam").value.trim();
      if (!team.startsWith("#") && /^\d/.test(team)) team = "#" + team;
      Store.logHours({ date: $("#hDate").value, hours, team, link: $("#hLink").value.trim(), notes: $("#hNotes").value.trim(), by: me.name });
      e.target.reset();
      UI.toast("Submitted. We'll review the recording soon.");
      paint();
    });

    paint();
  });

  function paint() {
    const { approved, pending, left } = Store.hoursTotals();
    $("#capNum").textContent = approved + pending;
    $("#capLeft").textContent = `${left} left`;
    // let the bar animate in from 0
    requestAnimationFrame(() => {
      $("#capApproved").style.width = (approved / capPerSeason) * 100 + "%";
      $("#capPending").style.left = (approved / capPerSeason) * 100 + "%";
      $("#capPending").style.width = (pending / capPerSeason) * 100 + "%";
    });

    const rows = Store.hours();
    // only allow http(s) links to render as anchors
    const safe = (u) => (/^https?:\/\//i.test(u) ? esc(u) : "#");
    $("#logBody").innerHTML = rows.length
      ? rows.map((h) => `<tr>
          <td>${esc(h.date)}</td>
          <td>${esc(h.team)}</td>
          <td>${h.hours}</td>
          <td><a href="${safe(h.link)}" target="_blank" rel="noopener noreferrer">recording</a></td>
          <td><span class="status ${h.status}">${h.status}</span></td>
        </tr>`).join("")
      : `<tr><td colspan="5" class="muted" style="font-style:italic">Nothing logged yet.</td></tr>`;
  }
})();
