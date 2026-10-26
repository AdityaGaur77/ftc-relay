# FTC Relay

A mentoring site for FTC teams. Experienced people (alumni, students still competing, engineers and judges) mentor younger and rookie teams.

## Pages

- `index.html`: home page
- `mentors.html`: mentor directory with filters. Click a card to open the full bio, experience timeline, booking form and team feedback. Feedback is **helped / didn't help**, not stars, and only teams who've booked a session can leave it.
- `board.html`: community message board with topics, upvotes and replies. Mentor replies get an orange stripe.
- `messages.html`: direct messages with mentors
- `hours.html`: volunteer-hours rules, the season cap meter and a form for logging recorded sessions

## Running it

Plain HTML/CSS/JS, no build step.

**Deploy on Vercel:** import the repo in Vercel, leave Framework Preset as "Other", and leave the build command and output directory empty. `vercel.json` turns on clean URLs, so pages live at `/mentors`, `/board` and so on.

**Run locally:**

```
npx vercel dev
```

`npx serve .` also works.

## Things to change

- **Mentor profiles** are samples in `js/store.js` (`mentors` array). Replace them with real people.
- **Hour rules** (cap per season, max per call, season name) are in `HOURS` at the top of `js/store.js`. The wording of the rules is in `hours.html`.
- **Data is saved in each visitor's browser (localStorage)**. Posts, messages, bookings and hour logs are not shared between people yet. To make it real, connect a backend (Supabase or Firebase are both easy) and swap out the functions in `js/store.js`. The pages only talk to `Store`, so nothing else needs to change. Login, hour approval by the NPO and call links would come with that.
