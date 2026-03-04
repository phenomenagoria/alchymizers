Good catch — I didn’t explicitly mention GitHub Pages in that last plan, but the architecture I described is designed to run on GitHub Pages. Let me clarify how it fits in, because that’s important for your niece’s implementation.


---

Hosting Plan — GitHub Pages

The entire game can be deployed as a static website on GitHub Pages.

GitHub Pages supports:

HTML

CSS

JavaScript

static assets (images, sounds)


It does NOT support servers, databases, or backend code.

That’s why the architecture uses:

PeerJS (WebRTC) for networking

deterministic game simulation in the browser

room creator acting as host


Everything runs client-side.


---

Deployment Structure

Repository example:

moonshine-quacks/
│
├── index.html
├── styles.css
├── app.js
│
├── engine/
│   ├── gameEngine.js
│   ├── rng.js
│   └── rules.js
│
├── network/
│   ├── peer.js
│   └── messages.js
│
├── ui/
│   ├── board.js
│   ├── leaderboard.js
│   └── chat.js
│
└── assets/
    ├── tokens/
    ├── cards/
    └── icons/

When deployed, the game lives at:

https://username.github.io/moonshine-quacks

Players simply open the site in their browser.


---

GitHub Pages Deployment Steps

Your niece would do:

1️⃣ Create a GitHub repository
2️⃣ Add the project files
3️⃣ Push to main branch

Then enable Pages:

Settings → Pages → Deploy from branch → main

GitHub builds the site automatically.


---

Joining a Game (Hosted on GitHub Pages)

Example workflow:

Host

Host opens:

https://username.github.io/moonshine-quacks

Clicks Create Room

Game generates:

hostPeerId = x4g8z12

Join link:

https://username.github.io/moonshine-quacks/#join?host=x4g8z12

Host sends the link to friends.


---

Player

Player opens the link.

The browser:

peer.connect(hostPeerId)

Game joins the room.

No server required.


---

Important Note About PeerJS

Even though the gameplay is fully peer-to-peer, WebRTC still requires signaling to establish connections.

PeerJS handles this automatically.

Two options:

Option A (simplest)

Use the public PeerJS signaling server.

No infrastructure needed.

Option B (later improvement)

Run a tiny PeerJS signaling server somewhere.

But for a student project / first version, Option A is perfectly fine.


---

Why GitHub Pages Works Well For This

Because the game is:

• fully client-side
• deterministic
• peer-to-peer
• small bandwidth

GitHub Pages gives you:

✔ free hosting
✔ automatic deploys
✔ shareable URL
✔ HTTPS (required for WebRTC)

It’s actually a perfect fit.


