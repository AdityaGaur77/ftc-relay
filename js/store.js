/* Data layer.
   Everything lives in localStorage for now so the site works as a plain
   static page (GitHub Pages, no server). Swap these functions for real API
   calls when we hook up a backend. */

(function () {
  const KEY = "ftcrelay:v1";

  // Volunteer-hour rules from the NPO. Change these here, not in the pages.
  const HOURS = {
    capPerSeason: 20,     // max hours one mentor can log per season
    maxPerSession: 2,     // a single call counts for at most this many hours
    season: "2026–27",
  };

  const SPECIALTIES = ["Programming", "CAD", "Build", "Strategy", "Outreach", "Portfolio", "Drive team"];

  const mentors = [
    {
      id: "maya",
      name: "Maya Okafor",
      kind: "alum",
      team: "#14872 Rust Belt Robotics",
      years: 4,
      color: "#2f5bea",
      specialties: ["Programming", "Strategy"],
      blurb: "Wrote our auto from scratch three seasons in a row. Happy to look at your Road Runner paths or just talk through why your robot drifts.",
      bio: "I ran software for Rust Belt for four seasons and now study CS. Most of what I know I learned by breaking things the week before a qualifier, so I'm pretty good at debugging under pressure. I like working with rookie programmers who've never touched Java before. No question is too basic, seriously.",
      experience: [
        ["2025–now", "CS student. Still volunteer as a field tech at state."],
        ["2024–25", "Software lead. Inspire 2nd place at state."],
        ["2023–24", "Software lead. Think Award, Control Award at regionals."],
        ["2021–23", "Programmer, then drive coach."],
      ],
      slots: ["Tue 6:30 PM", "Thu 7:00 PM", "Sat 11:00 AM", "Sun 4:00 PM"],
    },
    {
      id: "arjun",
      name: "Arjun Mehta",
      kind: "current",
      team: "#20311 Ctrl Alt Defeat",
      years: 3,
      color: "#b8327f",
      specialties: ["CAD", "Build"],
      blurb: "Onshape person. I'll help you get from a sketch on a napkin to a drivetrain that doesn't fall apart in match 2.",
      bio: "I'm a junior and still competing, so I know what this season's game looks like from the inside. I do most of our CAD in Onshape and I'm obsessive about linear slides. If your team doesn't have a CAD person yet, I can help you get one going.",
      experience: [
        ["2026–27", "CAD + build lead (current season)."],
        ["2025–26", "Design Award at league championship."],
        ["2024–25", "Rookie year. Built our first mecanum chassis."],
      ],
      slots: ["Mon 5:00 PM", "Wed 8:00 PM", "Sat 2:00 PM"],
    },
    {
      id: "sofia",
      name: "Sofia Lindqvist",
      kind: "pro",
      team: "Mechanical engineer · ex-#9821",
      years: 7,
      color: "#1d3a9e",
      specialties: ["Build", "Portfolio", "Strategy"],
      blurb: "I judge at qualifiers now. Bring me your engineering portfolio and I'll tell you what judges actually read.",
      bio: "I competed in FTC back in high school and I've been a judge for the last few seasons. I work as a mechanical engineer. Teams usually come to me for portfolio reviews and judging interview prep, but I'm also good for mechanism design and figuring out what to cut when you're out of time.",
      experience: [
        ["2022–now", "Judge at qualifiers and state."],
        ["2019–now", "Mechanical engineer, industrial automation."],
        ["2014–17", "Team #9821 member, build captain senior year."],
      ],
      slots: ["Tue 8:00 PM", "Sun 10:00 AM"],
    },
    {
      id: "devon",
      name: "Devon Price",
      kind: "alum",
      team: "#11904 Gearheads Anonymous",
      years: 5,
      color: "#6a3fd0",
      specialties: ["Drive team", "Strategy"],
      blurb: "Drove for five seasons. Scouting sheets, alliance selection, and how not to panic when your intake jams on the field.",
      bio: "I was driver for basically my whole FTC career. What I can help with: drive practice routines, building a scouting system that you'll actually use, alliance selection strategy, and the mental side of competition days. I also coach a middle school FLL team now.",
      experience: [
        ["2025–now", "Coach, FLL team at my old middle school."],
        ["2024–25", "Driver. Finalist alliance captain at state."],
        ["2020–24", "Driver + scouting lead."],
      ],
      slots: ["Wed 6:00 PM", "Fri 7:30 PM", "Sat 9:00 AM", "Sun 6:00 PM"],
    },
    {
      id: "hannah",
      name: "Hannah Cho",
      kind: "current",
      team: "#22450 Torque Witches",
      years: 2,
      color: "#c2447f",
      specialties: ["Outreach", "Portfolio"],
      blurb: "We ran 30+ outreach events last season. I'll help you plan ones that are actually worth putting in the portfolio.",
      bio: "I'm outreach lead on my team and I put together our portfolio last year. If you're a new team wondering how to get sponsors, run a demo at a library, or write about outreach without it sounding fake, I've got you.",
      experience: [
        ["2026–27", "Outreach lead, portfolio editor."],
        ["2025–26", "Connect Award at qualifier."],
      ],
      slots: ["Mon 7:00 PM", "Thu 5:30 PM"],
    },
    {
      id: "theo",
      name: "Theo Abernathy",
      kind: "alum",
      team: "#8417 Loose Screws",
      years: 4,
      color: "#2b3242",
      specialties: ["Programming", "CAD"],
      blurb: "Vision + AprilTags + a lot of OpenCV. Also the guy who will tell you to just use a color sensor.",
      bio: "Alum, now in college doing robotics. I did a lot of vision work in FTC (OpenCV, AprilTags, EasyOpenCV pipelines) and some CAD. I like helping teams figure out the simplest thing that works instead of the coolest thing that might work.",
      experience: [
        ["2024–now", "Robotics engineering student."],
        ["2022–24", "Programmer. Control Award winner, worlds qualifier."],
        ["2020–22", "CAD + build."],
      ],
      slots: ["Tue 9:00 PM", "Sat 4:00 PM", "Sun 1:00 PM"],
    },
  ];

  const now = Date.now();
  const H = 3600 * 1000, D = 24 * H;

  const seed = {
    me: null,
    feedback: [
      { mentor: "maya", by: "Leo (#23901)", positive: true, note: "Found the bug in our odometry in about ten minutes. We had been stuck for two weeks.", at: now - 3 * D },
      { mentor: "maya", by: "Rina (#24117)", positive: true, note: "Super patient with our rookie programmers.", at: now - 9 * D },
      { mentor: "maya", by: "anonymous", positive: true, note: "", at: now - 15 * D },
      { mentor: "arjun", by: "Sam (#23688)", positive: true, note: "Helped us redesign our slides. They no longer bend under load.", at: now - 2 * D },
      { mentor: "arjun", by: "Kai (#24002)", positive: false, note: "Showed up 15 min late. Advice was good once we got going though.", at: now - 11 * D },
      { mentor: "sofia", by: "Priya (#22981)", positive: true, note: "Our portfolio is so much better. She was blunt in a helpful way.", at: now - 5 * D },
      { mentor: "sofia", by: "Marcus (#23455)", positive: true, note: "Judging interview practice was exactly what we needed.", at: now - 20 * D },
      { mentor: "devon", by: "Jules (#24310)", positive: true, note: "Our drivers actually have a practice plan now.", at: now - 4 * D },
      { mentor: "devon", by: "anonymous", positive: false, note: "Felt a bit rushed.", at: now - 18 * D },
      { mentor: "devon", by: "Ana (#23120)", positive: true, note: "", at: now - 25 * D },
      { mentor: "hannah", by: "Owen (#24555)", positive: true, note: "Gave us a list of 12 places to do outreach in our town.", at: now - 6 * D },
      { mentor: "theo", by: "Zara (#23777)", positive: true, note: "Talked us out of a vision system we didn't need, which saved us weeks.", at: now - 7 * D },
      { mentor: "theo", by: "Ben (#24089)", positive: true, note: "AprilTag localization finally works.", at: now - 13 * D },
    ],
    bookings: [],
    posts: [
      {
        id: "p1", cat: "Programming", title: "Robot drifts left during auto even with encoders?",
        body: "Mecanum drive, using RUN_TO_POSITION on all four motors. It's fine for short moves but on anything over 2 tiles it drifts left like 3 inches. We checked the wheels are on the right way. Any ideas?",
        by: "Leo", team: "#23901", at: now - 5 * H, votes: 7,
        replies: [
          { by: "Maya Okafor", mentor: true, body: "Almost always a heading problem, not a distance problem. Add IMU heading correction, even a simple P loop on yaw will fix most of it. Happy to walk through it on a call.", at: now - 4 * H },
          { by: "Rina", team: "#24117", body: "We had the same thing, one of our motors had a slightly different gear ratio from a bad swap. Worth checking!", at: now - 2 * H },
        ],
      },
      {
        id: "p2", cat: "Season Q&A", title: "Rookie team, first qualifier in 3 weeks. What should we focus on?",
        body: "We have a robot that drives and can sort of pick things up. No auto yet. 5 people on the team. What would you prioritize?",
        by: "Jules", team: "#24310", at: now - 1 * D, votes: 12,
        replies: [
          { by: "Devon Price", mentor: true, body: "1) A dead-simple auto that parks. Free points. 2) Drive practice, seriously, 30 min a day. 3) Start your portfolio NOW, not the night before.", at: now - 22 * H },
          { by: "Sofia Lindqvist", mentor: true, body: "+1 on the portfolio. Judges care a lot about what you learned, not just what you built. Rookie teams win judged awards all the time.", at: now - 20 * H },
        ],
      },
      {
        id: "p3", cat: "Hardware", title: "Viper slides vs. custom belt-driven slides",
        body: "Is it worth making our own slides or should we just buy the kit ones? Budget is tight.",
        by: "Sam", team: "#23688", at: now - 2 * D, votes: 5,
        replies: [
          { by: "Arjun Mehta", mentor: true, body: "If budget is tight and it's your first time, buy them. Custom is fun but it eats weeks you don't have mid-season.", at: now - 2 * D + 3 * H },
        ],
      },
      {
        id: "p4", cat: "Outreach", title: "How do you find places to do outreach?",
        body: "We're in a small town and the only thing we've done is a demo at our own school.",
        by: "Owen", team: "#24555", at: now - 3 * D, votes: 4,
        replies: [
          { by: "Hannah Cho", mentor: true, body: "Libraries, scout troops, elementary school STEM nights, local makerspaces, and the county fair if you have one. Email the librarian first, they always say yes.", at: now - 3 * D + 5 * H },
        ],
      },
      {
        id: "p5", cat: "Off-topic", title: "What's your team's competition day food?",
        body: "Ours is gas station sandwiches. Looking for better ideas.",
        by: "Zara", team: "#23777", at: now - 4 * D, votes: 9,
        replies: [
          { by: "Ben", team: "#24089", body: "Our parents do a crockpot of mac and cheese. Highly recommend.", at: now - 4 * D + 2 * H },
          { by: "Theo Abernathy", mentor: true, body: "Pack actual water. Every year someone on the drive team gets a headache by eliminations.", at: now - 3 * D },
        ],
      },
    ],
    // conversations keyed by the other person's id
    threads: {
      maya: [
        { from: "maya", text: "Hey! Saw you joined Relay. If you want, send me your auto code before our call and I'll take a look first.", at: now - 6 * H },
      ],
    },
    hours: [],
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage blocked or corrupted; fall through to seed */ }
    return JSON.parse(JSON.stringify(seed));
  }

  let db = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* private mode: keep in memory */ }
  }

  const uid = () => Math.random().toString(36).slice(2, 10);

  window.Store = {
    HOURS,
    SPECIALTIES,

    me: () => db.me,
    setMe(me) { db.me = me; save(); },

    mentors: () => mentors,
    mentor: (id) => mentors.find((m) => m.id === id),

    feedbackFor: (id) => db.feedback.filter((f) => f.mentor === id).sort((a, b) => b.at - a.at),
    score(id) {
      const list = db.feedback.filter((f) => f.mentor === id);
      const pos = list.filter((f) => f.positive).length;
      return { pos, neg: list.length - pos, total: list.length, pct: list.length ? Math.round((pos / list.length) * 100) : null };
    },
    myFeedback(id) {
      const me = db.me;
      return me ? db.feedback.find((f) => f.mentor === id && f.byId === me.id) : null;
    },
    leaveFeedback(id, positive, note, anon) {
      const me = db.me;
      db.feedback = db.feedback.filter((f) => !(f.mentor === id && f.byId === me.id));
      db.feedback.push({
        mentor: id, byId: me.id, positive, note: note.trim(), at: Date.now(),
        by: anon ? "anonymous" : me.name + (me.team ? ` (${me.team})` : ""),
      });
      save();
    },

    bookings: () => db.bookings,
    bookingsFor: (id) => db.bookings.filter((b) => b.mentor === id),
    book(b) { db.bookings.push({ id: uid(), at: Date.now(), ...b }); save(); },
    hasBookedWith(id) { const me = db.me; return !!me && db.bookings.some((b) => b.mentor === id && b.byId === me.id); },

    posts: () => db.posts,
    addPost(p) {
      const me = db.me;
      db.posts.unshift({ id: uid(), at: Date.now(), votes: 1, voted: true, replies: [], by: me.name, team: me.team, mentor: me.role === "mentor", ...p });
      save();
    },
    reply(postId, body) {
      const me = db.me;
      const p = db.posts.find((x) => x.id === postId);
      p.replies.push({ by: me.name, team: me.team, mentor: me.role === "mentor", body, at: Date.now() });
      save();
    },
    vote(postId) {
      const p = db.posts.find((x) => x.id === postId);
      p.voted = !p.voted;
      p.votes += p.voted ? 1 : -1;
      save();
      return p;
    },

    threads: () => db.threads,
    send(to, text) {
      (db.threads[to] ||= []).push({ from: "me", text, at: Date.now() });
      save();
    },
    openThread(to) { db.threads[to] ||= []; save(); },

    hours: () => db.hours,
    logHours(h) { db.hours.unshift({ id: uid(), status: "pending", at: Date.now(), ...h }); save(); },
    hoursTotals() {
      const approved = db.hours.filter((h) => h.status === "approved").reduce((s, h) => s + h.hours, 0);
      const pending = db.hours.filter((h) => h.status === "pending").reduce((s, h) => s + h.hours, 0);
      return { approved, pending, left: Math.max(0, HOURS.capPerSeason - approved - pending) };
    },

    reset() { localStorage.removeItem(KEY); db = load(); },
    uid,
  };
})();
