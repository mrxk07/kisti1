import crypto from 'crypto';

const IP_HASH_SECRET = process.env.IP_HASH_SECRET || 'default-dev-secret-change-in-production';

export function hashIP(ip: string): string {
  const hmac = crypto.createHmac('sha256', IP_HASH_SECRET);
  hmac.update(ip.normalize());
  return hmac.digest('hex');
}

export function getClientIP(request: Request): string {
  // Vercel / standard proxy headers
  const headers = request.headers || {};
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP.trim();
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) return cfIP.trim();
  return '127.0.0.1';
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return computed === hash;
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>"'&]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;',
  })[c] || c);
}
