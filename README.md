# LocalPeek

Open your local dev project on your phone over the same Wi-Fi network. No cloud, no tunnels, no accounts.

```bash
cd your-project
npx localpeek
```

Scan the QR code that shows up in your terminal. Your project opens on your phone.

## Install

```bash
npm install -g localpeek
```

or run it without installing:

```bash
npx localpeek
```

## Usage

```bash
localpeek                 # detect and run the current project
localpeek --port 5000     # ask for a specific port
localpeek --iface eth0    # prefer a specific network interface
localpeek --dir ../app    # point at a different project folder
lp                         # short alias for localpeek
```

## What it does

1. Looks at the current folder and figures out what kind of project it is (plain HTML, Vite, Next.js, Astro, or anything else with a `dev` script).
2. Starts the dev server for you, bound so your phone can actually reach it (not just `localhost`).
3. Finds your computer's real LAN IP address.
4. Prints a QR code, straight in the terminal, no image, no upload, no third party.
5. You scan it, your phone opens the project.

Everything happens on your machine and your local network. LocalPeek never sends your project, your code, or your network info anywhere.

## Supported projects

- Plain HTML/CSS/JS
- Vite
- Next.js
- Astro
- Vue, Nuxt, Svelte, SvelteKit, Angular, Remix (via a generic adapter that reuses your `dev` script)
- Any other npm project with a `dev` script

Full details, requirements, and troubleshooting: see [GUIDE.md](./GUIDE.md).

## License

MIT — see [LICENSE](./LICENSE).

Built by [Dipto Thakur](https://github.com/dipto-thakur).
