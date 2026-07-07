import { useEffect, useState } from 'react';
import * as svc from '../api/services';
import type { Employee, LookupItem } from '../api/types';
import { lookupName, formatShift } from '../utils/format';

/** Normalize an expanded relation (string | number | {name} | null) to a label. */
function relName(v: any): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  return lookupName(v);
}

export interface EmployeeOrg {
  department: string;
  designation: string;
  shift: string;
  workLocation: string;
  loading: boolean;
}

/**
 * Resolves the logged-in employee's org details for display.
 *
 * The `/me` payload only carries IDs (and a null department), but the dedicated
 * `/profile` endpoint returns the expanded relations as ready-to-display strings
 * (department, designation, shift, work_location). We use those for the names,
 * and additionally look up `/shifts` so the shift can show its timing.
 */
export function useEmployeeOrg(user?: Employee | null): EmployeeOrg {
  const [org, setOrg] = useState<EmployeeOrg>({
    department: '—',
    designation: '—',
    shift: '—',
    workLocation: '—',
    loading: true,
  });

  const empKey = user?.id ?? user?.code;

  useEffect(() => {
    let active = true;
    setOrg(o => ({ ...o, loading: true }));
    (async () => {
      const [profile, shiftList] = await Promise.all([
        svc.getProfile().catch(() => null),
        svc.shifts().catch(() => [] as LookupItem[]),
      ]);
      if (!active) return;
      const p: any = profile || user || {};
      const shiftItem = p.shift_id != null ? shiftList.find(s => Number(s.id) === Number(p.shift_id)) : null;
      setOrg({
        department: relName(p.department),
        designation: relName(p.designation),
        shift: shiftItem ? formatShift(shiftItem) : relName(p.shift),
        workLocation: relName(p.work_location),
        loading: false,
      });
    })();
    return () => {
      active = false;
    };
  }, [empKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return org;
}
