import type { ImportContactItem } from "@/api/follower";

// ---- Column mapping types ----

export interface ColumnMapping {
  phoneCol: string | null;
  firstNameCol: string | null;
  lastNameCol: string | null;
  fullNameCol: string | null; // split by first space → first_name + last_name
  emailCol: string | null;    // detected but not forwarded to backend yet
  lineUidCol: string | null;
}

export interface ParsedCSVRow {
  phone?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  line_uid?: string;
  _raw: Record<string, string>;
}

export interface DetectionResult {
  headers: string[];
  mapping: ColumnMapping;
  rows: ParsedCSVRow[];
  sample: ParsedCSVRow[]; // first 5 rows for preview
}

// ---- Alias tables (case-insensitive, trimmed) ----

const PHONE_ALIASES = new Set([
  "phone", "telephone", "tel", "mobile", "hp", "mobile_no", "phone_no",
  "phonenumber", "phone_number", "เบอร์", "เบอร์โทร", "เบอร์โทรศัพท์",
  "เบอร์มือถือ", "เบอร์ติดต่อ",
]);

const FIRST_NAME_ALIASES = new Set([
  "first_name", "firstname", "fname", "first",
  "ชื่อ", "ชื่อจริง",
]);

const LAST_NAME_ALIASES = new Set([
  "last_name", "lastname", "lname", "last", "surname",
  "นามสกุล",
]);

const FULL_NAME_ALIASES = new Set([
  "name", "fullname", "full_name", "displayname", "display_name",
  "ชื่อ-นามสกุล", "ชื่อเต็ม",
]);

const EMAIL_ALIASES = new Set([
  "email", "mail", "e-mail", "อีเมล", "อีเมล์",
]);

const LINE_UID_ALIASES = new Set([
  "line_uid", "lineuid", "line_user_id", "uid", "line_id", "lineid",
]);

// ---- Column detector ----

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    phoneCol: null,
    firstNameCol: null,
    lastNameCol: null,
    fullNameCol: null,
    emailCol: null,
    lineUidCol: null,
  };

  for (const h of headers) {
    const key = h.trim().toLowerCase().replace(/\s+/g, "_");
    if (!mapping.phoneCol && PHONE_ALIASES.has(key)) {
      mapping.phoneCol = h;
    } else if (!mapping.firstNameCol && FIRST_NAME_ALIASES.has(key)) {
      mapping.firstNameCol = h;
    } else if (!mapping.lastNameCol && LAST_NAME_ALIASES.has(key)) {
      mapping.lastNameCol = h;
    } else if (!mapping.fullNameCol && FULL_NAME_ALIASES.has(key)) {
      mapping.fullNameCol = h;
    } else if (!mapping.emailCol && EMAIL_ALIASES.has(key)) {
      mapping.emailCol = h;
    } else if (!mapping.lineUidCol && LINE_UID_ALIASES.has(key)) {
      mapping.lineUidCol = h;
    }
  }

  return mapping;
}

// ---- CSV delimiter auto-detection ----

function detectDelimiter(lines: string[]): string {
  const candidates = [",", "\t", "|", ";"];
  const sample = lines.slice(0, Math.min(5, lines.length));
  let best = ",";
  let bestScore = -1;

  for (const delim of candidates) {
    const counts = sample.map((l) => l.split(delim).length);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    // Prefer delimiter that gives consistent column count > 1
    if (min > 1 && min === max && min > bestScore) {
      bestScore = min;
      best = delim;
    }
  }

  return best;
}

// ---- CSV row parser (handles quoted fields) ----

function parseCSVRow(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ---- Phone-only line detector ----

/** Returns true when a string looks like a bare phone number (no header). */
function looksLikePhoneNumber(s: string): boolean {
  const t = s.trim();
  // Starts with +, 0, or is purely digits/spaces/dashes
  return /^[+0][\d\s\-().]{4,}$/.test(t) || /^\d{6,}$/.test(t);
}

// ---- Main parse function ----

export function parseCSVText(text: string): DetectionResult {
  // Strip BOM
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], mapping: detectColumnMapping([]), rows: [], sample: [] };
  }

  // ---- Phone-only mode: no header row, every line is a phone number ----
  // Detect when first line itself looks like a phone number (e.g. user pasted
  // a plain list of numbers without a header row).
  if (looksLikePhoneNumber(lines[0])) {
    const syntheticHeaders = ["phone"];
    const mapping = detectColumnMapping(syntheticHeaders);
    const rows: ParsedCSVRow[] = lines
      .map((l) => l.trim())
      .filter(Boolean)
      .map((phone) => ({ phone, _raw: { phone } }));
    return { headers: syntheticHeaders, mapping, rows, sample: rows.slice(0, 5) };
  }

  const delimiter = detectDelimiter(lines);
  const headers = parseCSVRow(lines[0], delimiter);
  const mapping = detectColumnMapping(headers);

  const dataLines = lines.slice(1);
  const rows: ParsedCSVRow[] = [];

  for (const line of dataLines) {
    const values = parseCSVRow(line, delimiter);
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => {
      raw[h] = values[i] ?? "";
    });

    const row: ParsedCSVRow = { _raw: raw };

    if (mapping.phoneCol) {
      const phone = raw[mapping.phoneCol]?.trim() ?? "";
      if (phone) row.phone = phone;
    }

    if (mapping.firstNameCol) {
      row.first_name = raw[mapping.firstNameCol]?.trim() || undefined;
    }
    if (mapping.lastNameCol) {
      row.last_name = raw[mapping.lastNameCol]?.trim() || undefined;
    }

    // Split full_name into first + last if individual name cols not found
    if (mapping.fullNameCol && !mapping.firstNameCol && !mapping.lastNameCol) {
      const fullName = raw[mapping.fullNameCol]?.trim() ?? "";
      if (fullName) {
        const spaceIdx = fullName.indexOf(" ");
        if (spaceIdx !== -1) {
          row.first_name = fullName.slice(0, spaceIdx).trim();
          row.last_name = fullName.slice(spaceIdx + 1).trim();
        } else {
          row.first_name = fullName;
        }
      }
    }

    if (mapping.emailCol) {
      row.email = raw[mapping.emailCol]?.trim() || undefined;
    }
    if (mapping.lineUidCol) {
      row.line_uid = raw[mapping.lineUidCol]?.trim() || undefined;
    }

    rows.push(row);
  }

  return {
    headers,
    mapping,
    rows,
    sample: rows.slice(0, 5),
  };
}

// ---- Thai phone normalization ----

/** Count rows whose phone starts with "0" (no country code). */
export function countZeroPrefixPhones(rows: ParsedCSVRow[]): number {
  return rows.filter((r) => r.phone?.startsWith("0")).length;
}

/** Convert "0XXXXXXXXX" → "+66XXXXXXXXX" for all rows. */
export function normalizeThaiPhones(rows: ParsedCSVRow[]): ParsedCSVRow[] {
  return rows.map((r) => ({
    ...r,
    phone: r.phone?.startsWith("0") ? "+66" + r.phone.slice(1) : r.phone,
  }));
}

// ---- Convert parsed rows to API items ----

export function toImportItems(rows: ParsedCSVRow[]): ImportContactItem[] {
  return rows
    .filter((r) => r.phone && r.phone.trim().length > 0)
    .map((r) => ({
      phone: r.phone!,
      first_name: r.first_name || undefined,
      last_name: r.last_name || undefined,
      line_uid: r.line_uid || undefined,
    }));
}
