'use strict';

// CAVEMAN: No color/UI dependency. Hand-rolled ANSI + box drawing.
// Falls back to plain text when the terminal can't handle it
// (non-TTY, NO_COLOR, dumb terminals, piped output).

const supportsColor =
  process.stdout.isTTY &&
  process.env.TERM !== 'dumb' &&
  !('NO_COLOR' in process.env);

const isTTY = Boolean(process.stdout.isTTY);

function wrap(code) {
  return (str) => (supportsColor ? `\u001b[${code}m${str}\u001b[0m` : String(str));
}

const colors = {
  reset: wrap('0'),
  bold: wrap('1'),
  dim: wrap('2'),
  italic: wrap('3'),
  green: wrap('32'),
  yellow: wrap('33'),
  red: wrap('31'),
  cyan: wrap('36'),
  magenta: wrap('35'),
  blue: wrap('34'),
  gray: wrap('90'),
  white: wrap('97'),
};

// Compose helpers, e.g. colors.boldCyan('x')
colors.boldCyan = (s) => colors.bold(colors.cyan(s));
colors.boldWhite = (s) => colors.bold(colors.white(s));

const symbols = {
  check: supportsColor ? '✓' : 'v',
  cross: supportsColor ? '✗' : 'x',
  warn: '!',
  arrow: supportsColor ? '→' : '->',
  bullet: supportsColor ? '›' : '-',
  dot: '·',
};

// Visible-length helper: strips ANSI codes before measuring, so
// padding/box math isn't thrown off by color codes.
function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}

function visibleLength(str) {
  return stripAnsi(str).length;
}

function padEndVisible(str, width) {
  const len = visibleLength(str);
  return len >= width ? str : str + ' '.repeat(width - len);
}

// ---------------------------------------------------------------
// Basic lines
// ---------------------------------------------------------------

function blank() {
  console.log('');
}

function raw(msg) {
  console.log(msg);
}

function info(msg) {
  console.log(`  ${msg}`);
}

function success(msg) {
  console.log(`  ${colors.green(symbols.check)} ${msg}`);
}

function warn(msg) {
  console.log(`  ${colors.yellow(symbols.warn)} ${msg}`);
}

function error(msg) {
  console.error(`  ${colors.red(symbols.cross)} ${msg}`);
}

function line(label, value) {
  const padded = label.padEnd(11, ' ');
  console.log(`  ${colors.dim(padded)} ${value}`);
}

function step(n, msg) {
  console.log(`  ${colors.dim(`${n}.`)} ${msg}`);
}

// ---------------------------------------------------------------
// Banner — small, premium, not full ASCII-art bloat
// ---------------------------------------------------------------

function banner(version, author) {
  blank();
  raw(`  ${colors.boldCyan('▲ LocalPeek')} ${colors.dim(`v${version}`)}`);
  if (author) raw(`  ${colors.dim(`by ${author}`)}`);
  blank();
}

// ---------------------------------------------------------------
// Boxed panel (rounded corners), auto-sized to content
// ---------------------------------------------------------------

/**
 * Draws a rounded box around `lines` (array of pre-formatted strings,
 * color codes allowed). Optional `title` renders inline on the top
 * border, like a labeled panel.
 */
function box(lines, { title: boxTitle, minWidth = 0, padding = 1 } = {}) {
  const contentWidth = Math.max(
    minWidth,
    ...lines.map(visibleLength),
    boxTitle ? visibleLength(boxTitle) + 2 : 0
  );
  const innerWidth = contentWidth + padding * 2;

  const top = boxTitle
    ? `╭─ ${colors.bold(boxTitle)} ${'─'.repeat(Math.max(0, innerWidth - visibleLength(boxTitle) - 3))}╮`
    : `╭${'─'.repeat(innerWidth)}╮`;
  const bottom = `╰${'─'.repeat(innerWidth)}╯`;

  raw(`  ${top}`);
  for (const l of lines) {
    const padded = padEndVisible(l, contentWidth);
    raw(`  │${' '.repeat(padding)}${padded}${' '.repeat(padding)}│`);
  }
  raw(`  ${bottom}`);
}

// ---------------------------------------------------------------
// Spinner — for "detecting project", "starting dev server", etc.
// No-op animation when not a TTY (just prints the label once).
// ---------------------------------------------------------------

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function createSpinner(initialText) {
  let text = initialText;
  let frame = 0;
  let timer = null;
  let active = false;

  function render() {
    const f = colors.cyan(SPINNER_FRAMES[frame % SPINNER_FRAMES.length]);
    process.stdout.write(`\r  ${f} ${text}${' '.repeat(4)}`);
    frame += 1;
  }

  return {
    start() {
      if (!isTTY) {
        raw(`  ${symbols.dot} ${text}`);
        return this;
      }
      active = true;
      render();
      timer = setInterval(render, 80);
      return this;
    },
    update(newText) {
      text = newText;
      if (!isTTY) {
        raw(`  ${symbols.dot} ${text}`);
      }
      return this;
    },
    stop(finalText, kind = 'success') {
      if (active) {
        clearInterval(timer);
        active = false;
        // Clear the spinner line.
        process.stdout.write('\r' + ' '.repeat(text.length + 8) + '\r');
      }
      if (finalText) {
        if (kind === 'success') success(finalText);
        else if (kind === 'warn') warn(finalText);
        else info(finalText);
      }
    },
  };
}

module.exports = {
  colors,
  symbols,
  blank,
  raw,
  info,
  success,
  warn,
  error,
  line,
  step,
  banner,
  box,
  createSpinner,
  visibleLength,
};
