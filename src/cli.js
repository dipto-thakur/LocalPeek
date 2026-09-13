'use strict';

const path = require('path');
const { detectProject } = require('./detect.js');
const { getBestLanAddress, getLanCandidates } = require('./network.js');
const { isPortFree, findFreePort, probeExistingServer } = require('./port.js');
const { printQr } = require('./qr.js');
const {
  spawnDevServer,
  startStaticServer,
  waitUntilListening,
  defaultPortFor,
} = require('./server.js');
const logger = require('./logger.js');
const { LocalPeekError } = require('./errors.js');

const VERSION = require('../package.json').version;
const AUTHOR = 'Dipto Thakur';

const HELP_TEXT = `
LocalPeek — open your local dev project on your phone over LAN

Usage:
  localpeek [options]
  lp [options]

Options:
  -p, --port <number>   Port to run on (default: framework's usual port)
  -i, --iface <name>    Prefer a specific network interface (e.g. en0, Wi-Fi)
  -d, --dir <path>      Project directory (default: current directory)
  -v, --version         Print the version number
  -h, --help            Show this help message

Examples:
  localpeek
  localpeek --port 5000
  npx localpeek
`;

function parseArgs(argv) {
  const opts = { port: null, iface: null, dir: process.cwd(), help: false, version: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-p':
      case '--port':
        opts.port = Number(argv[++i]);
        break;
      case '-i':
      case '--iface':
        opts.iface = argv[++i];
        break;
      case '-d':
      case '--dir':
        opts.dir = path.resolve(argv[++i]);
        break;
      case '-v':
      case '--version':
        opts.version = true;
        break;
      case '-h':
      case '--help':
        opts.help = true;
        break;
      default:
        // CAVEMAN: Unknown flags are ignored rather than crashing —
        // this stays a small, forgiving tool.
        break;
    }
  }

  return opts;
}

function printFriendlyError(err) {
  logger.blank();
  logger.error(err.message);
  if (err.hint) {
    logger.info(logger.colors.dim(err.hint));
  }
  logger.blank();
}

async function run(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    logger.raw(HELP_TEXT);
    return;
  }

  if (opts.version) {
    logger.raw(VERSION);
    return;
  }

  logger.banner(VERSION, AUTHOR);

  // ---- Detect project -------------------------------------------------
  const detectSpinner = logger.createSpinner('Detecting project...').start();
  let project;
  try {
    project = detectProject(opts.dir);
  } catch (err) {
    detectSpinner.stop();
    if (err instanceof LocalPeekError) {
      printFriendlyError(err);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
  detectSpinner.stop(`Detected ${logger.colors.bold(project.type)} project`);

  // ---- Find LAN address -------------------------------------------------
  const lanSpinner = logger.createSpinner('Finding LAN address...').start();
  let lan;
  try {
    lan = getBestLanAddress(opts.iface);
  } catch (err) {
    lanSpinner.stop();
    if (err instanceof LocalPeekError) {
      printFriendlyError(err);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
  const candidates = getLanCandidates();
  lanSpinner.stop(`Found network address ${logger.colors.dim(`(${lan.iface})`)}`);

  // ---- Resolve port -------------------------------------------------
  const desiredPort = opts.port || defaultPortFor(project.type);
  const portSpinner = logger.createSpinner(`Checking port ${desiredPort}...`).start();

  const portFree = await isPortFree(desiredPort);
  let port = desiredPort;
  let reusingExisting = false;

  if (portFree) {
    portSpinner.stop(`Port ${port} is free`);
  } else {
    const looksAlive = await probeExistingServer(desiredPort);
    if (looksAlive && !opts.port) {
      // CAVEMAN: Something is already serving on the expected port.
      // Reuse it instead of starting a duplicate process — but only
      // when the user didn't explicitly ask for this exact port
      // (an explicit --port request means "use this port or tell me
      // why not", not "silently reuse whatever's there").
      reusingExisting = true;
      port = desiredPort;
      portSpinner.stop(`Server already running on ${port} — reusing it`);
    } else {
      const found = await findFreePort(desiredPort + 1);
      if (!found) {
        portSpinner.stop();
        printFriendlyError(
          new LocalPeekError(`Could not find a free port near ${desiredPort}`, {
            hint: 'Free up some ports, or pass --port <number> to choose one directly.',
          })
        );
        process.exitCode = 1;
        return;
      }
      port = found;
      portSpinner.stop(`Port ${desiredPort} was busy — using ${port} instead`, 'warn');
    }
  }

  const host = '0.0.0.0';
  const mobileUrl = `http://${lan.address}:${port}`;
  const localUrl = `http://localhost:${port}`;

  let stopFn = null;

  if (!reusingExisting) {
    try {
      if (project.type === 'html') {
        const serveSpinner = logger.createSpinner('Starting static server...').start();
        const httpServer = await startStaticServer(project.dir, port, host);
        stopFn = () => httpServer.close();
        serveSpinner.stop('Static server ready');
      } else {
        // CAVEMAN: The dev server's own output is inherited straight
        // to this terminal (stdio:'inherit'), so a spinner here would
        // fight with it for the same line. Print a plain marker
        // instead and let the framework's own logs speak.
        logger.info(logger.colors.dim(`Starting dev server (${project.adapter})...`));
        logger.blank();
        const { stop } = spawnDevServer(project, port, host);
        stopFn = stop;

        const ready = await waitUntilListening(port);
        logger.blank();
        if (!ready) {
          logger.warn(
            'The dev server is taking a while to start. LocalPeek will keep waiting — check the output above for errors.'
          );
        } else {
          logger.success('Dev server is up');
        }
      }
    } catch (err) {
      if (err instanceof LocalPeekError) {
        printFriendlyError(err);
        process.exitCode = 1;
        return;
      }
      throw err;
    }
  }

  await printSummary({
    project,
    localUrl,
    mobileUrl,
    port,
    lan,
    candidates,
    reusingExisting,
  });

  installShutdownHandlers(stopFn);

  // Keep the process alive. For spawned children, stdio:'inherit'
  // keeps the terminal attached already; for the static server we
  // just idle until Ctrl+C.
  if (project.type === 'html') {
    await new Promise(() => {}); // eslint-disable-line no-unused-vars
  }
}

async function printSummary({ project, localUrl, mobileUrl, port, lan, candidates, reusingExisting }) {
  const { colors } = logger;
  const qrString = await printQr(mobileUrl);

  logger.blank();
  logger.box(
    [
      `${colors.dim('Local')}    ${colors.dim(localUrl)}`,
      `${colors.dim('Network')}  ${colors.boldWhite(mobileUrl)}`,
    ],
    { title: 'Ready' }
  );

  logger.blank();
  logger.info('Scan with your phone:');
  logger.blank();
  logger.raw(qrString);
  logger.blank();

  logger.line('Framework:', project.type);
  logger.line('Port:', String(port));
  logger.line('Interface:', `${lan.iface} (${lan.address})`);
  logger.blank();

  logger.info(colors.bold('Next steps'));
  logger.step(1, 'Make sure your phone is on the same Wi-Fi network.');
  logger.step(2, `Open ${colors.cyan(mobileUrl)} on your phone, or scan the QR code above.`);
  logger.step(3, 'Edit your project — changes show up like normal.');
  logger.blank();

  if (reusingExisting) {
    logger.info(
      colors.dim(`Reused the server already running on port ${port} instead of starting a new one.`)
    );
  }

  if (candidates.length > 1) {
    logger.info(
      colors.dim(
        `Multiple network interfaces found — using ${lan.iface}. Pass --iface <name> to pick another.`
      )
    );
  }

  if (reusingExisting || candidates.length > 1) logger.blank();

  logger.info(
    colors.dim("Phone can't connect? Check you're on the same network, no VPN, and the port isn't firewalled.")
  );
  logger.blank();
  logger.info(colors.dim(`${logger.symbols.bullet} Press `) + colors.bold('Ctrl+C') + colors.dim(' to stop.'));
  logger.blank();
}

function installShutdownHandlers(stopFn) {
  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.blank();
    logger.info('Stopping LocalPeek...');
    if (stopFn) {
      try {
        stopFn();
      } catch {
        // CAVEMAN: Best-effort shutdown. If the child is already
        // gone, there's nothing more to do.
      }
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { run, parseArgs };
