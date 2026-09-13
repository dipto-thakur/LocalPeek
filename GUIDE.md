# LocalPeek Guide

Simple words. No jargon. Read this if something is confusing.

## What LocalPeek do

You build website on computer. Computer show website at `localhost`. Phone cannot see `localhost` — phone not the same computer.

LocalPeek find real address of your computer on your Wi-Fi (like `192.168.1.5`). LocalPeek make QR code with that address. You scan QR with phone. Phone open website. Done.

No cloud. No upload. No account. Just computer and phone talking on same Wi-Fi, direct.

## Install

Global install (use anywhere):

```bash
npm install -g localpeek
```

Or skip install, run once:

```bash
npx localpeek
```

## Basic use

Go to your project folder. Run command:

```bash
localpeek
```

or short version:

```bash
lp
```

LocalPeek do rest:

1. Look at folder. Guess what kind of project (plain HTML? Vite? Next.js? Astro? something else?).
2. Start dev server, correct way, so phone can reach it.
3. Find your computer's Wi-Fi address.
4. Print QR code in terminal.
5. Show URL too, in case QR scan hard.

Scan QR with phone camera. Website open.

Stop anytime: press `Ctrl+C`.

## Supported project types

- Plain HTML/CSS/JS (just an `index.html`)
- Vite
- Next.js
- Astro
- Vue, Nuxt, Svelte, SvelteKit, Angular, Remix — LocalPeek use your project's own `dev` script and try to point it at right address
- Any other npm project with a `dev` script in `package.json`

LocalPeek never change your project files. LocalPeek only read, never write.

## LAN requirement (important!)

Computer and phone must be on **same network**.

Good:
- Both on same Wi-Fi router.
- Phone connect to computer's Mobile Hotspot, computer use that hotspot's network.

Bad (will not work):
- Computer on Wi-Fi, phone on mobile data (4G/5G). Different network, no connection possible.
- Computer connected through VPN. VPN can hide or change your real address. Try disconnecting VPN if QR doesn't work.
- Phone and computer on same Wi-Fi, but router use "client isolation" or "AP isolation" (common on public/office/guest Wi-Fi, and even some home routers). This blocks devices from seeing each other even on same network. Try a different network, or check router settings.

## Phone hotspot behavior

Using phone as hotspot for the computer? That's fine — same rule applies, both devices need to be on the same network. When phone is the hotspot, computer connects to phone's network, and things should just work the same way.

## Firewall

Your computer's firewall might block incoming connections on the dev server's port. LocalPeek does **not** touch your firewall automatically (that would be risky to do blindly).

If your phone times out trying to connect:

- **Windows**: Windows Defender Firewall may ask permission the first time Node.js tries to accept a network connection. Allow it for Private networks.
- **macOS**: System Settings → Network → Firewall may block incoming connections to `node`. Allow it, or temporarily turn off firewall to test.
- **Linux**: check `ufw` or your distro's firewall tool; you may need to allow the port.

## Common errors, explained

**"No project found in [folder]"**
LocalPeek looked in that folder and found no `index.html` and no usable `package.json`. Make sure you're in the right folder.

**"This project has a package.json but no installed dependencies"**
Your project needs `npm install` (or `yarn`/`pnpm install`) run first. LocalPeek never installs things for you — that's your call.

**"No usable LAN network address was found on this computer"**
LocalPeek couldn't find a normal Wi-Fi/Ethernet address. Usually means you're not connected to any network, or you're only connected through virtual adapters (VPN, Docker, VM). Connect to real Wi-Fi/Ethernet and try again.

**"Port already in use" / "Port X was busy — using Y instead"**
Something else is already using that port. LocalPeek just picks the next free one automatically. If LocalPeek instead says it's *reusing* a server on that port, that's because something already running there looks like your project — LocalPeek shows you the QR for it instead of starting a duplicate.

**Phone scans QR but page never loads**
Almost always one of: different networks, VPN in the way, router client isolation, or firewall blocking the port. See sections above.

## How framework detection works

LocalPeek looks (only reads, never edits) at:

- `package.json` — dependencies, devDependencies, and the `scripts.dev` entry
- Known config files — `vite.config.*`, `next.config.*`, `astro.config.*`, `nuxt.config.*`, `angular.json`, `svelte.config.js`, etc.
- Whether `node_modules` exists

It checks specific frameworks first (Next.js, Astro, SvelteKit, etc.), then falls back to Vite, then to any project with a `dev` script, then to plain HTML if there's an `index.html`.

LocalPeek always prefers your existing `dev` script over inventing its own command — it just adds flags (like `--host`) so the server is reachable from your phone, and picks a port.

## Publishing / updating this package (for maintainers)

1. Make your changes.
2. Bump the version in `package.json` (`npm version patch` / `minor` / `major`).
3. Log in once: `npm login`.
4. Publish: `npm publish`.
5. Tag the release in git and push tags: `git push --follow-tags`.

That's it. No build step — LocalPeek ships as plain CommonJS.
