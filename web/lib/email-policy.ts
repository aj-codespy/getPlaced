const ALLOWED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "yahoo.co.in",
  "icloud.com",
  "me.com",
  "aol.com",
  "gmx.com",
  "protonmail.com",
  "proton.me",
]);

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com",
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "yopmail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "dispostable.com",
  "maildrop.cc",
  "mintemail.com",
  "fakeinbox.com",
  "trashmail.com",
  "getnada.com",
  "mailnesia.com",
  "moakt.com",
  "mytrashmail.com",
  "trashmail.ws",
]);

const ALLOWED_ACADEMIC_SUFFIXES = [
  ".edu",
  ".edu.in",
  ".edu.au",
  ".ac.in",
  ".ac.uk",
  ".ac.jp",
  ".edu.sg",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailPolicyCode =
  | "EMAIL_INVALID_FORMAT"
  | "DISPOSABLE_EMAIL_BLOCKED"
  | "EMAIL_DOMAIN_NOT_ALLOWED";

export type EmailPolicyResult =
  | { ok: true; normalizedEmail: string; domain: string }
  | { ok: false; code: EmailPolicyCode; message: string };

export function evaluateEmailForAuth(emailRaw: string): EmailPolicyResult {
  const normalizedEmail = (emailRaw || "").trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return {
      ok: false,
      code: "EMAIL_INVALID_FORMAT",
      message: "Please enter a valid email address.",
    };
  }

  const at = normalizedEmail.lastIndexOf("@");
  const domain = normalizedEmail.slice(at + 1);

  const isDisposable = Array.from(DISPOSABLE_EMAIL_DOMAINS).some(
    (blocked) => domain === blocked || domain.endsWith(`.${blocked}`),
  );
  if (isDisposable) {
    return {
      ok: false,
      code: "DISPOSABLE_EMAIL_BLOCKED",
      message: "Temporary or disposable email addresses are not allowed.",
    };
  }

  const isAcademic = ALLOWED_ACADEMIC_SUFFIXES.some(
    (suffix) => domain === suffix.slice(1) || domain.endsWith(suffix),
  );
  if (ALLOWED_EMAIL_DOMAINS.has(domain) || isAcademic) {
    return { ok: true, normalizedEmail, domain };
  }

  return {
    ok: false,
    code: "EMAIL_DOMAIN_NOT_ALLOWED",
    message:
      "Please use Gmail, a supported traditional provider, or an academic (.edu/.ac) email.",
  };
}

export function getAuthErrorMessage(code?: string | null): string {
  switch (code) {
    case "EMAIL_INVALID_FORMAT":
      return "Please enter a valid email address.";
    case "DISPOSABLE_EMAIL_BLOCKED":
      return "Temporary/disposable email addresses are not allowed.";
    case "EMAIL_DOMAIN_NOT_ALLOWED":
      return "Use Gmail, a supported personal provider, or an academic (.edu/.ac) email.";
    default:
      return "Invalid email or password. Please try again.";
  }
}
