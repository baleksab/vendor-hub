export type DbEnv = {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
};

export type JwtEnv = {
  secret: string;
  expiresInSeconds: number;
};

export type ImageEnv = {
  directory: string;
  maxBytes: number;
  maxPerProduct: number;
};

export type CartEnv = {
  maxLines: number;
};

export type OrdersEnv = {
  paymentTtlMinutes: number;
  paymentMaxAttempts: number;
  returnWindowDays: number;
  schedulerIntervalSeconds: number;
  schedulerBatchSize: number;
};

export type ServerEnv = {
  host: string;
  port: number;
  db: DbEnv;
  jwt: JwtEnv;
  images: ImageEnv;
  cart: CartEnv;
  orders: OrdersEnv;
};

export type SeedEnv = {
  db: DbEnv;
  admin: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    address: string;
    phoneNumber: string;
    country: string;
  };
};

type Source = Record<string, string | undefined>;

const JWT_SECRET_MIN_BYTES = 32;

function required(source: Source, key: string): string {
  const value = source[key];

  if (value === undefined || value.trim() === "") {
    throw new Error(
      `Missing required env key ${key} (set it in .env.local, .env.secret or the process environment)`,
    );
  }

  return value.trim();
}

function parsePort(source: Source, key: string): number {
  const raw = required(source, key);
  const port = Number(raw);

  if (!Number.isInteger(port) || port < 1 || port > 0xffff) {
    throw new Error(`Env key ${key} must be a port number, got "${raw}"`);
  }

  return port;
}

function parsePositiveInteger(source: Source, key: string): number {
  const raw = required(source, key);
  const value = Number(raw);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Env key ${key} must be a positive integer, got "${raw}"`);
  }

  return value;
}

function parseJwtSecret(source: Source, key: string): string {
  const secret = required(source, key);

  if (Buffer.byteLength(secret) < JWT_SECRET_MIN_BYTES) {
    throw new Error(`Env key ${key} must be at least ${JWT_SECRET_MIN_BYTES} bytes long`);
  }

  return secret;
}

export function loadDbEnv(source: Source = process.env): DbEnv {
  return {
    host: required(source, "DB_HOST"),
    port: parsePort(source, "DB_PORT"),
    name: required(source, "DB_NAME"),
    user: required(source, "DB_USER"),
    password: required(source, "DB_PASSWORD"),
  };
}

export function loadImageEnv(source: Source = process.env): ImageEnv {
  return {
    directory: required(source, "PRODUCT_IMAGE_DIR"),
    maxBytes: parsePositiveInteger(source, "PRODUCT_IMAGE_MAX_BYTES"),
    maxPerProduct: parsePositiveInteger(source, "PRODUCT_IMAGE_MAX_PER_PRODUCT"),
  };
}

export function loadServerEnv(source: Source = process.env): ServerEnv {
  return {
    host: required(source, "SERVER_HOST"),
    port: parsePort(source, "SERVER_PORT"),
    db: loadDbEnv(source),
    jwt: {
      secret: parseJwtSecret(source, "JWT_SECRET"),
      expiresInSeconds: parsePositiveInteger(source, "JWT_EXPIRES_IN_SECONDS"),
    },
    images: loadImageEnv(source),
    cart: { maxLines: parsePositiveInteger(source, "CART_MAX_LINES") },
    orders: {
      paymentTtlMinutes: parsePositiveInteger(source, "ORDER_PAYMENT_TTL_MINUTES"),
      paymentMaxAttempts: parsePositiveInteger(source, "ORDER_PAYMENT_MAX_ATTEMPTS"),
      returnWindowDays: parsePositiveInteger(source, "ORDER_RETURN_WINDOW_DAYS"),
      schedulerIntervalSeconds: parsePositiveInteger(source, "ORDER_SCHEDULER_INTERVAL_SECONDS"),
      schedulerBatchSize: parsePositiveInteger(source, "ORDER_SCHEDULER_BATCH_SIZE"),
    },
  };
}

export function loadSeedEnv(source: Source = process.env): SeedEnv {
  return {
    db: loadDbEnv(source),
    admin: {
      email: required(source, "ADMIN_EMAIL"),
      password: required(source, "ADMIN_PASSWORD"),
      firstName: required(source, "ADMIN_FIRST_NAME"),
      lastName: required(source, "ADMIN_LAST_NAME"),
      address: required(source, "ADMIN_ADDRESS"),
      phoneNumber: required(source, "ADMIN_PHONE_NUMBER"),
      country: required(source, "ADMIN_COUNTRY"),
    },
  };
}
