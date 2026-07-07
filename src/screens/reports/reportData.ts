import dayjs from 'dayjs';
import * as svc from '../../api/services';
import type { Employee, PunchRecord } from '../../api/types';

const two = (n: number) => String(n).padStart(2, '0');

/** Clock value ("10:54:00" → "10:54"), or "--:--" when empty/zero. */
export function timeVal(v?: string | null): string {
  if (!v) return '--:--';
  const m = /^(\d{1,2}):(\d{2})/.exec(String(v).trim());
  if (!m) return '--:--';
  const hh = two(Number(m[1]));
  if (hh === '00' && m[2] === '00') return '--:--';
  return `${hh}:${m[2]}`;
}

/** Duration value ("01:54:00" → "01:54"), keeping "00:00". */
export function durVal(v?: string | null): string {
  if (!v) return '00:00';
  const m = /^(\d{1,2}):(\d{2})/.exec(String(v).trim());
  if (!m) return '00:00';
  return `${two(Number(m[1]))}:${m[2]}`;
}

export function firstText(...vals: any[]): string {
  for (const v of vals) {
    if (v == null) continue;
    if (typeof v === 'object') {
      const n = v.name || v.title || v.label || v.short;
      if (n) return String(n);
      continue;
    }
    const s = String(v).trim();
    if (s) return s;
  }
  return '';
}

export interface DayReportData {
  record: PunchRecord | null;
  dept: string;
  shift: string;
}

/** Load the attendance record (plus dept/shift) for a given YYYY-MM-DD date. */
export async function loadReportData(dateStr: string, user?: Employee | null): Promise<DayReportData> {
  const day = dayjs(dateStr);
  const key = day.format('YYYY-MM-DD');
  const [hist, profile] = await Promise.all([
    svc.punchHistory({ month: day.format('YYYY-MM') }).catch(() => [] as PunchRecord[]),
    svc.getProfile().catch(() => null),
  ]);
  let rec = hist.find(r => dayjs(r.date).format('YYYY-MM-DD') === key) || null;
  if (!rec && day.isSame(dayjs(), 'day')) {
    const st = await svc.punchStatus().catch(() => null);
    if (st?.punch) rec = st.punch;
  }
  return {
    record: rec,
    dept: firstText((profile as any)?.department, (user as any)?.department) || '—',
    shift: firstText(rec?.shift, (profile as any)?.shift, (user as any)?.shift),
  };
}

/** Whether a single record satisfies the given report type's filter. */
export function recordMatches(type: string, r: PunchRecord): boolean {
  const st = String(r.status ?? '').toUpperCase().trim();
  const isLate = !!r.late_in && durVal(r.late_in) !== '00:00';
  const isErlOut = !!r.erl_out && durVal(r.erl_out) !== '00:00';
  const isOT = !!r.overtime && durVal(r.overtime) !== '00:00';
  const misPunch = !!r.intime && !r.outtime;
  switch (type) {
    case 'Performance':
    case 'Datewise Performance':
    case 'Present':
      return st === 'P' || !!r.intime;
    case 'Absent':
      return st === 'A';
    case 'Late In':
      return isLate;
    case 'Early Out':
      return isErlOut;
    case 'Over Time':
      return isOT;
    case 'Mis Punch':
      return misPunch;
    case 'Half Day':
      return st === 'HD';
    case 'In Out':
    case 'In/Out Report':
    case 'Access Control Report':
      return !!r.intime || !!r.outtime;
    case 'Periodic Report':
    case 'Periodic Performance Report':
      return st === 'P' || !!r.intime;
    case 'Week Off':
      return st === 'WO' || st === 'W';
    default:
      // Types without a data source yet (SummaryType1/2, Selfie*, Special,
      // COFF, Early In, Selfie Pending) → treated as no data.
      return false;
  }
}

/** Whether the given report type has a row for the day's record. */
export function reportHasData(type: string, record: PunchRecord | null): boolean {
  return !!record && recordMatches(type, record);
}

/** Records within a month that match the given report type. */
export function filterByType(type: string, records: PunchRecord[]): PunchRecord[] {
  return records.filter(r => recordMatches(type, r));
}

export interface MonthReportData {
  records: PunchRecord[];
  dept: string;
  shift: string;
}

/** Load all attendance records (plus dept/shift) for a given YYYY-MM month. */
export async function loadMonthData(monthStr: string, user?: Employee | null): Promise<MonthReportData> {
  const month = dayjs(monthStr);
  const [hist, profile] = await Promise.all([
    svc.punchHistory({ month: month.format('YYYY-MM') }).catch(() => [] as PunchRecord[]),
    svc.getProfile().catch(() => null),
  ]);
  const records = [...hist].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  return {
    records,
    dept: firstText((profile as any)?.department, (user as any)?.department) || '—',
    shift: firstText((profile as any)?.shift, (user as any)?.shift),
  };
}

/** Whether a monthly report of the given type has any rows. */
export function monthHasData(type: string, records: PunchRecord[]): boolean {
  return filterByType(type, records).length > 0;
}

export interface YearMonthStat {
  ym: string; // YYYY-MM
  present: number;
  absent: number;
  wo: number;
}

export interface YearReportData {
  stats: YearMonthStat[];
  dept: string;
}

/** Per-month Present/Absent/WeekOff counts across an inclusive month range. */
export async function loadYearData(fromMonth: string, toMonth: string, user?: Employee | null): Promise<YearReportData> {
  const from = dayjs(fromMonth).startOf('month');
  const to = dayjs(toMonth).startOf('month');
  const months: string[] = [];
  let m = from;
  let guard = 0;
  while ((m.isBefore(to) || m.isSame(to, 'month')) && guard < 60) {
    months.push(m.format('YYYY-MM'));
    m = m.add(1, 'month');
    guard += 1;
  }
  const [lists, profile] = await Promise.all([
    Promise.all(months.map(mo => svc.punchHistory({ month: mo }).catch(() => [] as PunchRecord[]))),
    svc.getProfile().catch(() => null),
  ]);
  const stats: YearMonthStat[] = months.map((ym, i) => {
    let present = 0, absent = 0, wo = 0;
    lists[i].forEach(r => {
      const u = String(r.status ?? '').toUpperCase().trim();
      if (u === 'P') present += 1;
      else if (u === 'A') absent += 1;
      else if (u === 'WO' || u === 'W') wo += 1;
    });
    return { ym, present, absent, wo };
  });
  return { stats, dept: firstText((profile as any)?.department, (user as any)?.department) || '—' };
}

/** Whether a yearly report has any counts. */
export function yearHasData(stats: YearMonthStat[]): boolean {
  return stats.some(s => s.present + s.absent + s.wo > 0);
}

/** Load attendance records within an inclusive date range (YYYY-MM-DD). */
export async function loadRangeData(fromStr: string, toStr: string, user?: Employee | null): Promise<MonthReportData> {
  const from = dayjs(fromStr).startOf('day');
  const to = dayjs(toStr).endOf('day');
  const months: string[] = [];
  let m = from.startOf('month');
  while (m.isBefore(to) || m.isSame(to, 'month')) {
    months.push(m.format('YYYY-MM'));
    m = m.add(1, 'month');
  }
  const [lists, profile] = await Promise.all([
    Promise.all(months.map(mo => svc.punchHistory({ month: mo }).catch(() => [] as PunchRecord[]))),
    svc.getProfile().catch(() => null),
  ]);
  const records = lists
    .flat()
    .filter(r => {
      const d = dayjs(r.date);
      return !d.isBefore(from, 'day') && !d.isAfter(to, 'day');
    })
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  return {
    records,
    dept: firstText((profile as any)?.department, (user as any)?.department) || '—',
    shift: firstText((profile as any)?.shift, (user as any)?.shift),
  };
}
