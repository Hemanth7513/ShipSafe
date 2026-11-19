import dns from 'dns/promises';
import net from 'net';
import { SSRFValidationResult } from '@/lib/types/scan';

/**
 * Checks if an IPv4 address belongs to private, loopback, link-local,
 * cloud metadata, or reserved ranges according to RFC 6890 / RFC 1918.
 */
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Treat malformed IPs as unsafe
  }

  const [a, b, c] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private)
  if (a === 10) return true;

  // 100.64.0.0/10 (Shared Address Space / CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-Local / AWS/GCP/Azure Cloud Metadata)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && c === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future use)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address belongs to private, loopback, or link-local ranges.
 * Also unwraps and inspects IPv4-mapped IPv6 addresses (::ffff:127.0.0.1).
 */
export function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // Loopback (::1) or Unspecified (::)
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped IPv6 address (e.g., ::ffff:192.168.1.1 or ::ffff:7f00:1)
  if (normalized.includes('::ffff:')) {
    const rawIpv4 = normalized.split('::ffff:')[1];
    if (net.isIPv4(rawIpv4)) {
      return isPrivateIPv4(rawIpv4);
    }
    // If represented as hex, treat as unsafe
    return true;
  }

  // Unique Local Address (ULA) fc00::/7 (starts with fc or fd)
  if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) return true;

  // Link-Local Unicast fe80::/10 (starts with fe8, fe9, fea, feb)
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) return true;

  // Discard prefix 100::/64
  if (normalized.startsWith('100:')) return true;

  return false;
}

/**
 * Comprehensive SSRF Validator
 * Validates protocol, port, hostname, and resolves DNS to ensure the destination
 * IP address is strictly a publicly routable address.
 */
export async function validateUrlForSSRF(rawUrl: string): Promise<SSRFValidationResult> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return { allowed: false, error: 'Invalid URL format provided.' };
  }

  // 1. Strict Protocol Whitelist (HTTP/HTTPS only)
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { 
      allowed: false, 
      error: `Forbidden protocol "${parsedUrl.protocol}". Only http: and https: are permitted.` 
    };
  }

  // 2. Reject embedded user credentials (e.g., http://user:pass@evil.com)
  if (parsedUrl.username || parsedUrl.password) {
    return { 
      allowed: false, 
      error: 'URLs containing embedded authentication credentials are not permitted.' 
    };
  }

  // 3. Strict Port Restriction (Default 80, 443 only)
  if (parsedUrl.port && parsedUrl.port !== '80' && parsedUrl.port !== '443') {
    return { 
      allowed: false, 
      error: `Forbidden port "${parsedUrl.port}". Scans are strictly restricted to standard web ports (80, 443).` 
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // 4. Immediate localhost / special name blocking
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '0.0.0.0'
  ) {
    return { 
      allowed: false, 
      hostname, 
      error: `Access to local/internal hostname "${hostname}" is prohibited.` 
    };
  }

  // 5. If hostname is directly an IP literal
  const ipType = net.isIP(hostname);
  if (ipType === 4) {
    if (isPrivateIPv4(hostname)) {
      return { 
        allowed: false, 
        resolvedIp: hostname, 
        hostname, 
        error: `IP address "${hostname}" belongs to a private or restricted network range.` 
      };
    }
    return { allowed: true, resolvedIp: hostname, hostname };
  }

  if (ipType === 6) {
    if (isPrivateIPv6(hostname)) {
      return { 
        allowed: false, 
        resolvedIp: hostname, 
        hostname, 
        error: `IPv6 address "${hostname}" belongs to a private or restricted network range.` 
      };
    }
    return { allowed: true, resolvedIp: hostname, hostname };
  }

  // 6. DNS Resolution with Anti-DNS-Rebinding validation
  try {
    const addresses = await dns.lookup(hostname, { all: true });

    if (!addresses || addresses.length === 0) {
      return { allowed: false, hostname, error: `Could not resolve hostname "${hostname}".` };
    }

    // Verify EVERY resolved IP. If any resolved IP is private/internal, reject the request!
    for (const record of addresses) {
      const { address, family } = record;

      if (family === 4 && isPrivateIPv4(address)) {
        return {
          allowed: false,
          resolvedIp: address,
          hostname,
          error: `Domain "${hostname}" resolved to restricted internal IP ${address}. Request blocked.`
        };
      }

      if (family === 6 && isPrivateIPv6(address)) {
        return {
          allowed: false,
          resolvedIp: address,
          hostname,
          error: `Domain "${hostname}" resolved to restricted IPv6 address ${address}. Request blocked.`
        };
      }
    }

    // Return first resolved public IP for socket pinning
    return { 
      allowed: true, 
      resolvedIp: addresses[0].address, 
      hostname 
    };

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DNS lookup failed';
    return { allowed: false, hostname, error: `DNS resolution failed: ${message}` };
  }
}
