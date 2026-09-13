'use strict';

const os = require('os');
const { NoLanInterfaceError } = require('./errors.js');

// CAVEMAN: Do not assume the first network adapter is Wi-Fi.
// os.networkInterfaces() order is not guaranteed to mean anything.
// We score candidates instead of trusting position.

// Interface name patterns that usually mean "not a real LAN link
// a phone could reach" — virtual machines, containers, tunnels.
const VIRTUAL_NAME_PATTERNS = [
  /^docker/i,
  /^br-/i,
  /^veth/i,
  /^vmnet/i,
  /^vboxnet/i,
  /virtualbox/i,
  /^vEthernet/i,
  /hyper-?v/i,
  /^utun/i, // often VPN tunnels on macOS
  /^tun\d*/i,
  /^tap\d*/i,
  /^wsl/i,
  /loopback/i,
  /^lo$/i,
  /^anpi/i, // some macOS internal
  /^awdl/i, // Apple Wireless Direct Link, not a normal LAN
  /^llw/i,
  /^bridge/i,
  /^zt/i, // ZeroTier virtual adapter
  /^tailscale/i,
];

// Names that strongly suggest a real, physical, LAN-facing link.
const PREFERRED_NAME_PATTERNS = [
  /^wi-?fi/i,
  /^wlan/i,
  /^en0$/i, // common macOS Wi-Fi name
  /^eth\d*/i,
  /^ethernet/i,
  /^en\d+/i,
];

function looksVirtual(name) {
  return VIRTUAL_NAME_PATTERNS.some((re) => re.test(name));
}

function looksPreferred(name) {
  return PREFERRED_NAME_PATTERNS.some((re) => re.test(name));
}

/**
 * Returns a list of candidate LAN IPv4 addresses, best guess first.
 * Each candidate: { address, iface, score }
 */
function getLanCandidates() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family !== 'IPv4') continue;
      if (addr.internal) continue; // skips 127.0.0.1
      if (addr.address.startsWith('127.')) continue;

      let score = 0;
      if (looksVirtual(name)) score -= 10;
      if (looksPreferred(name)) score += 5;

      // Private LAN ranges are what we actually want.
      const isPrivateA = addr.address.startsWith('10.');
      const isPrivateB = /^172\.(1[6-9]|2\d|3[0-1])\./.test(addr.address);
      const isPrivateC = addr.address.startsWith('192.168.');
      const isLinkLocal = addr.address.startsWith('169.254.');

      if (isLinkLocal) {
        // 169.254.x.x means no DHCP lease — usually not reachable
        // from another device in a useful way.
        score -= 8;
      } else if (isPrivateA || isPrivateB || isPrivateC) {
        score += 3;
      }

      candidates.push({ address: addr.address, iface: name, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

/**
 * Picks the best LAN address, or throws NoLanInterfaceError.
 * If `preferredIface` is given (via --iface flag), it wins when present.
 */
function getBestLanAddress(preferredIface) {
  const candidates = getLanCandidates();

  if (candidates.length === 0) {
    throw new NoLanInterfaceError();
  }

  if (preferredIface) {
    const match = candidates.find((c) => c.iface === preferredIface);
    if (match) return match;
  }

  return candidates[0];
}

module.exports = { getLanCandidates, getBestLanAddress };
