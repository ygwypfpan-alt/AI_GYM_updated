const prefix = '[ai-gym-api]';

export function logStartup(message: string) {
  console.info(`${prefix} ${message}`);
}

export function logUnhandledError(error: unknown) {
  console.error(`${prefix} Unhandled API error:`, error);
}
