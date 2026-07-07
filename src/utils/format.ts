import dayjs from 'dayjs';
import type { Employee } from '../api/types';
import { colors as legacyColors } from '../theme';
import type { Palette } from '../theme';
import { BASE_URL } from '../api/client';

const ORIGIN = (BASE_URL.match(/^(https?:\/\/[^/]+)/) || [])[1] || '';
const APP_ROOT = BASE_URL.replace(/\/api\/?$/, '');

/**
 * Turn any image reference the API may return into a loadable absolute URL:
 * full URLs / data URIs are returned as-is; absolute paths get the origin;
 * relative paths are resolved against the app root (…/hrms-app).
 */
export function resolveMediaUrl(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (!v || v === 'null' || v === 'undefined' || v === '0') return null;
  if (/^(https?:|data:|file:)/i.test(v)) return v;
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return ORIGIN + v;
  return `${APP_ROOT}/${v.replace(/^\.?\//, '')}`;
}

const IMAGE_KEYS = [
  // Prefer ready-made absolute URLs (the API returns `img_url` as a CloudFront URL).
  'img_url', 'image_url', 'avatar_url', 'photo_url', 'profile_image_url',
  // Then fall back to raw path fields (resolved against the media host).
  'image', 'avatar', 'img', 'photo', 'profile_image', 'profile_picture',
  'profile_pic', 'picture', 'employee_image', 'emp_image', 'user_image', 'dp',
];

/** First usable profile-image URL found on an employee/profile object, or null. */
export function employeeImageUrl(emp?: Record<string, any> | null): string | null {
  if (!emp) return null;
  for (const k of IMAGE_KEYS) {
    const url = resolveMediaUrl(emp[k]);
    if (url) return url;
  }
  return null;
}

export function displayName(emp?: Employee | null): string {
  if (!emp) return '';
  if (emp.name) return emp.name;
  const full = [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim();
  if (full) return full;
  return emp.username || emp.code || 'Employee';
}

/**
 * Initials from the first name + surname (first and last word of the name).
 * "Dhaval Rathod" → "DR", "Test User" → "TU", "Dhaval Kumar Rathod" → "DR",
 * single-word names → their first letter.
 */
export function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase() || '?';
}

export function lookupName(value: any): string {
  if (value == null) return '—';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return value.name || value.title || value.label || '—';
}

export function formatDate(value?: string | null, fmt = 'DD MMM YYYY'): string {
  if (!value) return '—';
  const d = dayjs(value);
  return d.isValid() ? d.format(fmt) : String(value);
}

export function formatTime(value?: string | null, fmt = 'hh:mm A'): string {
  if (!value) return '—';
  const d = dayjs(value);
  return d.isValid() ? d.format(fmt) : String(value);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = dayjs(value);
  return d.isValid() ? d.format('DD MMM YYYY, hh:mm A') : String(value);
}

export function greeting(): string {
  const h = dayjs().hour();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function secondsToHM(seconds?: number): string {
  if (!seconds || seconds < 0) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

/** Format a clock string like "08:58:00" (time-of-day) into "08:58 AM". */
export function formatClock(value?: string | null, fmt = 'hh:mm A'): string {
  if (!value || value === '00:00:00' || value === '00:00') return '—';
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(value).trim());
  if (m) {
    const d = dayjs().hour(Number(m[1])).minute(Number(m[2])).second(0);
    return d.isValid() ? d.format(fmt) : String(value);
  }
  const dd = dayjs(value);
  return dd.isValid() ? dd.format(fmt) : String(value);
}

/** "9:00 AM - 7:00 PM" from a shift's in_time/out_time, or null if missing. */
export function shiftTiming(item: any): string | null {
  const inT = item?.in_time;
  const outT = item?.out_time;
  if (!inT || !outT) return null;
  const a = formatClock(inT, 'h:mm A');
  const b = formatClock(outT, 'h:mm A');
  if (a === '—' || b === '—') return null;
  return `${a} - ${b}`;
}

/** "shift 1 (9:00 AM - 7:00 PM)" — shift name with its timing appended. */
export function formatShift(item: any): string {
  if (!item) return '—';
  const name = lookupName(item);
  const t = shiftTiming(item);
  return t ? `${name} (${t})` : name;
}

/** Convert a "HH:mm:ss" duration into a compact "Xh Ym". */
export function hmsToHM(value?: string | null): string {
  if (!value) return '0h 0m';
  const m = /^(\d{1,2}):(\d{2})/.exec(String(value).trim());
  if (!m) return String(value);
  return `${Number(m[1])}h ${Number(m[2])}m`;
}

export interface StatusStyle {
  label: string;
  color: string;
  bg: string;
}

interface ChipColors {
  primary: string;
  primaryBg: string;
  success: string;
  successBg: string;
  danger: string;
  dangerBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
  muted: string;
  mutedBg: string;
}

/**
 * Resolve chip colours from the active theme palette when provided, otherwise
 * fall back to the legacy light-only map. Pass `useTheme().colors` from screens
 * so status chips respect dark mode.
 */
function chipColors(p?: Palette): ChipColors {
  if (p) {
    return {
      primary: p.primary,
      primaryBg: p.primarySoft,
      success: p.success,
      successBg: p.successSoft,
      danger: p.danger,
      dangerBg: p.dangerSoft,
      warning: p.warning,
      warningBg: p.warningSoft,
      info: p.info,
      infoBg: p.infoSoft,
      muted: p.textMuted,
      mutedBg: p.surfaceAlt,
    };
  }
  return {
    primary: legacyColors.primary,
    primaryBg: legacyColors.infoBg,
    success: legacyColors.success,
    successBg: legacyColors.successBg,
    danger: legacyColors.danger,
    dangerBg: legacyColors.dangerBg,
    warning: legacyColors.warning,
    warningBg: legacyColors.warningBg,
    info: legacyColors.info,
    infoBg: legacyColors.infoBg,
    muted: legacyColors.textMuted,
    mutedBg: legacyColors.cardAlt,
  };
}

/** Map a single-letter attendance status code to a labelled chip. */
export function attendanceStatus(code: any, palette?: Palette): StatusStyle {
  const c = chipColors(palette);
  const raw = String(code ?? '').toUpperCase().trim();
  switch (raw) {
    case 'P':
      return { label: 'Present', color: c.primary, bg: c.primaryBg };
    case 'A':
      return { label: 'Absent', color: c.danger, bg: c.dangerBg };
    case 'L':
      return { label: 'Leave', color: c.warning, bg: c.warningBg };
    case 'HD':
      return { label: 'Half Day', color: c.warning, bg: c.warningBg };
    case 'H':
      return { label: 'Holiday', color: c.info, bg: c.infoBg };
    case 'WO':
    case 'W':
      return { label: 'Week Off', color: c.muted, bg: c.mutedBg };
    default:
      return raw
        ? { label: raw, color: c.info, bg: c.infoBg }
        : { label: '—', color: c.muted, bg: c.mutedBg };
  }
}

/** Map an arbitrary status (string/number) to a labelled colour chip. */
export function statusStyle(status: any, palette?: Palette): StatusStyle {
  const c = chipColors(palette);
  const raw = String(status ?? '').toLowerCase().trim();
  if (['1', 'approved', 'accept', 'accepted', 'active', 'success', 'completed'].includes(raw)) {
    return { label: cap(raw === '1' ? 'approved' : raw), color: c.success, bg: c.successBg };
  }
  if (['2', 'rejected', 'reject', 'declined', 'cancelled', 'failed'].includes(raw)) {
    return { label: cap(raw === '2' ? 'rejected' : raw), color: c.danger, bg: c.dangerBg };
  }
  if (['0', 'pending', 'requested', 'waiting', 'in review', ''].includes(raw)) {
    return { label: 'Pending', color: c.warning, bg: c.warningBg };
  }
  return { label: cap(raw), color: c.info, bg: c.infoBg };
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
