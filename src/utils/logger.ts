// Logger seguro para desenvolvimento e produção
// - Em produção, somente erros são exibidos
// - Em desenvolvimento, níveis controlados por VITE_LOG_LEVEL (debug | info | warn | error | silent)
// - Redação automática de campos sensíveis (apiKey, secret, token, password, email, authorization, user_metadata, URL)

const isDev = import.meta.env.DEV;
const envLevel = String(import.meta.env.VITE_LOG_LEVEL || '').toLowerCase();

const levelOrder = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
} as const;

const activeLevel = ((): number => {
  // Produção: manter apenas erros
  if (!isDev) return levelOrder.error;
  // Desenvolvimento: por padrão, reduzir ruído para "error" a menos que o dev opte por mais verbosidade
  if (envLevel in levelOrder) return levelOrder[envLevel as keyof typeof levelOrder];
  return levelOrder.error;
})();

function shouldLog(level: keyof typeof levelOrder): boolean {
  return levelOrder[level] >= activeLevel;
}

const SENSITIVE_KEYS = new Set([
  'apikey', 'apiKey', 'secret', 'token', 'password', 'authorization',
  'email', 'user_metadata', 'baseurl', 'baseUrl', 'url'
]);

function shouldRedactString(str: string): boolean {
  if (!str) return false;
  if (/https?:\/\//i.test(str)) return true; // URLs
  if (/key|secret|token|password|authorization/i.test(str)) return true; // possíveis segredos mencionados em string
  return false;
}

function redactValue(_value: unknown): string {
  return '[REDACTED]';
}

function sanitize(value: any, depth = 0): any {
  if (value === null || value === undefined) return value;

  // strings
  if (typeof value === 'string') {
    return shouldRedactString(value) ? redactValue(value) : value;
  }

  // tipos primitivos
  if (typeof value !== 'object') return value;

  // evitar loops profundos
  if (depth > 3) return '[OBJECT_DEPTH_LIMIT]';

  // arrays
  if (Array.isArray(value)) {
    return value.map((v) => sanitize(v, depth + 1));
  }

  // objetos
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) {
    const keyLower = k.toLowerCase();
    if (SENSITIVE_KEYS.has(keyLower)) {
      out[k] = redactValue(v);
    } else {
      out[k] = sanitize(v, depth + 1);
    }
  }
  return out;
}

function formatArgs(args: any[]): any[] {
  return args.map((a) => (typeof a === 'object' ? sanitize(a) : sanitize(a)));
}

export const logger = {
  debug: (...args: any[]) => {
    if (isDev && shouldLog('debug')) console.debug(...formatArgs(args));
  },
  info: (...args: any[]) => {
    if (isDev && shouldLog('info')) console.info(...formatArgs(args));
  },
  warn: (...args: any[]) => {
    if (isDev && shouldLog('warn')) console.warn(...formatArgs(args));
  },
  error: (...args: any[]) => {
    // Em qualquer ambiente, permitimos erros, mas com sanitização
    console.error(...formatArgs(args));
  },
};

export default logger;