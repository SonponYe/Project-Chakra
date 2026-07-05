import "server-only";

// Temporary passwords for admin-created accounts (workers/admins), relayed
// out-of-band by whoever created the account -- no invite email involved.
export function generateTempPassword(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
