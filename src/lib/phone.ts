/**
 * Masks a phone number for display in the admin backoffice.
 * Example: "+66812345678" → "081-XXX-5678"
 *          "0812345678"   → "081-XXX-5678"
 */
export function maskPhone(phone: string): string {
  if (!phone) return "-";
  // Normalize: strip +66 prefix, ensure starts with 0
  const local = phone.startsWith("+66") ? "0" + phone.slice(3) : phone;
  if (local.length < 7) return local;
  return `${local.slice(0, 3)}-XXX-${local.slice(-4)}`;
}
