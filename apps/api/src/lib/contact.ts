export function normalizePhone(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^\d+]/g, '').trim();
  return normalized || null;
}

export function normalizeEmail(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized || null;
}
