'use strict';

const qrcodeTerminal = require('qrcode-terminal');

// CAVEMAN: QR must contain the real LAN IP, never 0.0.0.0 or localhost.
// The caller (server.js/cli.js) is responsible for passing the right
// URL in — this module just renders whatever string it is given.

/**
 * Renders a QR code to the terminal for `url` and resolves with the
 * ASCII-art string (also printed as a side effect of qrcode-terminal).
 */
function printQr(url) {
  return new Promise((resolve) => {
    qrcodeTerminal.generate(url, { small: true }, (qrString) => {
      resolve(qrString);
    });
  });
}

module.exports = { printQr };
