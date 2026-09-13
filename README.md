<div align="center">

# LocalPeek

**See your local dev project on your phone in 5 seconds zero cloud, zero tunnels, zero setup.**

One command turns any `localhost` project into a scannable QR code on your own Wi-Fi.

[![npm version](https://img.shields.io/npm/v/localpeek.svg)](https://www.npmjs.com/package/localpeek)
[![npm downloads](https://img.shields.io/npm/dm/localpeek.svg)](https://www.npmjs.com/package/localpeek)
[![node](https://img.shields.io/node/v/localpeek.svg)](https://nodejs.org)

```bash
npx localpeek
```

**That's it.** Scan the QR code. Your project opens on your phone.

</div>

---

## Why LocalPeek

Testing responsive design usually means deploying, tunneling through ngrok, or typing your laptop's IP address into your phone by hand. LocalPeek skips all of that.

- ⚡ **One command, zero config** `npx localpeek` and you're done, no flags required
- 🔒 **100% local, always** traffic never leaves your Wi-Fi network. No cloud relay, no account, no telemetry, no data collection
- 📷 **Real terminal QR code** scan and go, no typing IP addresses on a phone keyboard
- 🧠 **Auto-detects your stack** Plain HTML, Vite, Next.js, Astro, Vue, Nuxt, Svelte, SvelteKit, Angular, Remix
- 🛡️ **Never touches your project files** read-only detection, your `dev` script stays the source of truth
- 🖥️ **Cross-platform** Windows, macOS, Linux, WSL, and phone hotspots all work
- 🪶 **Tiny footprint** one dependency, no bloated framework underneath

If that saved you a `ngrok` signup or a "what's my IP" search, a ⭐ on the repo goes a long way it's how other developers find this instead of a heavier alternative.

---

## Install

The whole point is that you usually don't need to install anything:

```bash
npx localpeek
```

Prefer it always available as a command:

```bash
npm install -g localpeek
```

```bash
localpeek        # full command
lp               # short alias
```

---

## Usage

```bash
cd your-project
localpeek
```

```bash
localpeek                 # detect and run the current project
localpeek --port 5000     # ask for a specific port
localpeek --iface eth0    # prefer a specific network interface
localpeek --dir ../app    # point at a different project folder
localpeek --help          # see all options
```

## What happens under the hood

1. Reads the current folder and figures out what kind of project it is.
2. Starts (or reuses) the dev server, bound so your **phone** can reach it not just `localhost`.
3. Finds your computer's real LAN IP address (skipping VPNs, Docker, and virtual adapters).
4. Renders a QR code directly in your terminal no image file, no upload, no third-party API.
5. You scan it. Your phone opens the project. Live-reload, dev tools, everything works as normal.

Nothing here talks to the internet. LocalPeek never sends your project, your code, your IP, or anything else off of your machine.

---

## Supported projects

| Project type | Support |
|---|---|
| Plain HTML/CSS/JS | ✅ built-in static server |
| Vite | ✅ native adapter |
| Next.js | ✅ native adapter |
| Astro | ✅ native adapter |
| Vue, Nuxt, Svelte, SvelteKit, Angular, Remix | ✅ via generic adapter (reuses your `dev` script) |
| Anything else with a `dev` script | ✅ generic fallback |

## Specs

| | |
|---|---|
| **Dependencies** | 1 (`qrcode-terminal`) |
| **Requires** | Node.js ≥ 16 |
| **Platforms** | Windows · macOS · Linux · WSL |
| **Network** | Same-LAN only Wi-Fi, Ethernet, or phone hotspot |
| **Cloud/telemetry** | None. Ever. |
| **Project files** | Read-only never modified |

Full setup requirements, firewall notes, and troubleshooting: see **[GUIDE.md](./GUIDE.md)**.

---

## Support the project

If LocalPeek saved you time:

- ⭐ **[Star the repo](https://github.com/dipto-thakur/localpeek)** the easiest way to help others find it
- 🐛 Open an issue if something breaks on your setup
- 👀 **[Follow @dipto-thakur](https://github.com/dipto-thakur)** for more small, focused dev tools like this one

## License

MIT see [LICENSE](./LICENSE).

Built by [Dipto Thakur](https://github.com/dipto-thakur).
