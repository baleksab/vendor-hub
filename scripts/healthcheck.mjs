const [hostKey, portKey, path] = process.argv.slice(2);

const host = process.env[hostKey];
const port = process.env[portKey];

if (!host || !port || !path) {
  console.error("Usage: healthcheck.mjs <HOST_ENV_KEY> <PORT_ENV_KEY> <path>");
  process.exit(1);
}

try {
  const response = await fetch(`http://${host}:${port}${path}`);

  process.exit(response.ok ? 0 : 1);
} catch {
  process.exit(1);
}
