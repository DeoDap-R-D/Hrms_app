import dayjs from 'dayjs';
import type { PunchRecord, Leave } from '../api/types';

/**
 * Count applied leave days that fall within the given month, based on the
 * employee's leave requests (not the attendance `status === 'L'` records).
 * Rejected leaves are excluded; pending + approved are counted.
 */
export function leaveDaysInMonth(leaves: Leave[], month: dayjs.Dayjs): number {
  const start = month.startOf('month');
  const end = month.endOf('month');
  let count = 0;
  leaves.forEach(l => {
    const rejected = Number((l as any).is_approved) === 2 || (l as any).reject_employee_id != null;
    if (rejected) return;
    const from = l.leave_date_from ? dayjs(l.leave_date_from) : null;
    if (!from || !from.isValid()) return;
    const toRaw = l.leave_date_to ? dayjs(l.leave_date_to) : from;
    const to = toRaw.isValid() ? toRaw : from;
    let d = from.isBefore(start) ? start : from;
    const last = to.isAfter(end) ? end : to;
    while (!d.isAfter(last, 'day')) {
      count += 1;
      d = d.add(1, 'day');
    }
  });
  return count;
}

export interface MonthlyStats {
  total: number;
  present: number; // status P
  absent: number; // status A
  leave: number; // status L
  weekOff: number; // status WO / W / H
  late: number; // present days with a late_in
  onTime: number; // present days without late_in
}

function statusOf(r: PunchRecord): string {
  return String(r.status ?? '').toUpperCase().trim();
}

function isLate(r: PunchRecord): boolean {
  const v = String(r.late_in ?? '').trim();
  return !!v && v !== '00:00:00' && v !== '0' && v !== '00:00';
}

/**
 * Derive attendance KPIs for a set of daily punch records (one month).
 * All values come straight from the API records — no dummy data.
 */
export function monthlyAttendanceStats(records: PunchRecord[]): MonthlyStats {
  const s: MonthlyStats = { total: 0, present: 0, absent: 0, leave: 0, weekOff: 0, late: 0, onTime: 0 };
  records.forEach(r => {
    s.total += 1;
    const st = statusOf(r);
    if (st === 'P') {
      s.present += 1;
      if (isLate(r)) s.late += 1;
      else s.onTime += 1;
    } else if (st === 'A') {
      s.absent += 1;
    } else if (st === 'L') {
      s.leave += 1;
    } else if (st === 'WO' || st === 'W' || st === 'H' || st === 'HO') {
      s.weekOff += 1;
    }
  });
  return s;
}
