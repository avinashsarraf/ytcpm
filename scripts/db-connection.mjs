/** A pg.Client cannot be reconnected after a failed connect: create one per attempt. */
export async function connectWithRetry(createClient, { attempts = 5, retryMs = 2000, warn = console.warn } = {}) {
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 20 || !Number.isFinite(retryMs) || retryMs < 0 || retryMs > 60000) throw new Error('Invalid migration retry configuration');
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const client = createClient();
    try {
      await client.connect();
      return client;
    } catch (error) {
      await client.end().catch(() => {});
      // Do not expose arbitrary driver messages or connection URLs in boot logs.
      warn(`[migrate] connection attempt ${attempt}/${attempts} failed`);
      if (attempt === attempts) throw error;
      await new Promise(resolve => setTimeout(resolve, retryMs));
    }
  }
}
