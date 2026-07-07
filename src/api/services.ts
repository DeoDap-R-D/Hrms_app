import api, { unwrap } from './client';
import type {
  Employee,
  PunchStatus,
  PunchRecord,
  Leave,
  WorkReport,
  WorkReportTime,
  NotificationItem,
  LookupItem,
  Holiday,
  Policy,
  TrackingType,
} from './types';

/** Coerce the various list shapes the API may return into an array. */
function toArray<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== 'object') return [];
  if (Array.isArray(data.data)) return data.data as T[];
  if (Array.isArray(data.items)) return data.items as T[];
  if (Array.isArray(data.results)) return data.results as T[];
  return [];
}

/* ----------------------------------- Auth ---------------------------------- */

export interface LoginPayload {
  code?: string;
  email?: string;
  phone?: string;
  username?: string;
  password: string;
}

export async function login(payload: LoginPayload): Promise<{ token: string; user?: Employee }> {
  const res = await api.post('/login', payload, { headers: { 'Content-Type': 'application/json' } });
  const data = unwrap<any>(res.data);
  const token = data?.token || data?.access_token;
  const user = data?.user || data?.employee || data;
  return { token, user };
}

export async function me(): Promise<Employee> {
  const res = await api.get('/me');
  return unwrap<Employee>(res.data);
}

export async function logout(): Promise<void> {
  try {
    await api.post('/logout');
  } catch {
    // Best-effort; local token is cleared regardless.
  }
}

/* --------------------------------- Profile --------------------------------- */

export async function getProfile(): Promise<Employee> {
  const res = await api.get('/profile');
  return unwrap<Employee>(res.data);
}

export interface ProfileUpdate {
  email?: string;
  dob?: string;
  gender?: number;
  [key: string]: any;
}

export async function updateProfile(payload: ProfileUpdate): Promise<Employee> {
  const res = await api.post('/profile/update', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return unwrap<Employee>(res.data);
}

export async function acceptTerms(): Promise<void> {
  await api.post('/profile/accept-terms');
}

/* ---------------------------------- Punch ---------------------------------- */

export interface PunchPayload {
  type?: 'in' | 'out';
  latitude?: number;
  longitude?: number;
  image?: string;
  note?: string;
}

export async function punch(payload: PunchPayload): Promise<any> {
  const res = await api.post('/punch', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return unwrap(res.data);
}

export async function punchStatus(): Promise<PunchStatus> {
  const res = await api.get('/punch/status');
  return unwrap<PunchStatus>(res.data);
}

export async function punchHistory(params: { month?: string; from?: string; to?: string }): Promise<PunchRecord[]> {
  const res = await api.get('/punch/history', { params });
  return toArray<PunchRecord>(unwrap(res.data));
}

/* --------------------------------- Tracking -------------------------------- */

export async function trackingTypes(): Promise<TrackingType[]> {
  const res = await api.get('/tracking-types');
  return toArray<TrackingType>(unwrap(res.data));
}

export async function createTracking(tracking_type_id: number): Promise<any> {
  const res = await api.post('/tracking', { tracking_type_id }, {
    headers: { 'Content-Type': 'application/json' },
  });
  return unwrap(res.data);
}

/* ---------------------------------- Leaves --------------------------------- */

export async function listLeaves(): Promise<Leave[]> {
  const res = await api.get('/leaves');
  return toArray<Leave>(unwrap(res.data));
}

export interface CreateLeavePayload {
  leave_date_from: string;
  leave_date_to: string;
  reason_for_leave: string;
  total_leave_days: string;
  leave_time_from?: string;
  leave_time_to?: string;
}

export async function createLeave(payload: CreateLeavePayload): Promise<Leave> {
  const res = await api.post('/leaves', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return unwrap<Leave>(res.data);
}

export async function getLeave(id: number): Promise<Leave> {
  const res = await api.get(`/leaves/${id}`);
  return unwrap<Leave>(res.data);
}

/* ------------------------------- Work reports ------------------------------ */

export async function listWorkReports(params: { date?: string; month?: string }): Promise<WorkReport[]> {
  const res = await api.get('/work-reports', { params });
  return toArray<WorkReport>(unwrap(res.data));
}

export interface CreateWorkReportPayload {
  date: string;
  task: string;
  outcome: string;
  wr_time: number;
  report_type?: string;
  screen_shot?: string;
  remarks?: string;
}

export async function createWorkReport(payload: CreateWorkReportPayload): Promise<WorkReport> {
  const res = await api.post('/work-reports', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return unwrap<WorkReport>(res.data);
}

export async function workReportTimes(): Promise<WorkReportTime[]> {
  const res = await api.get('/work-report-times');
  return toArray<WorkReportTime>(unwrap(res.data));
}

/* ------------------------------ Notifications ------------------------------ */

export async function listNotifications(): Promise<NotificationItem[]> {
  const res = await api.get('/notifications');
  return toArray<NotificationItem>(unwrap(res.data));
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

/* --------------------------------- Lookups --------------------------------- */

export async function departments(): Promise<LookupItem[]> {
  const res = await api.get('/departments');
  return toArray<LookupItem>(unwrap(res.data));
}

export async function designations(): Promise<LookupItem[]> {
  const res = await api.get('/designations');
  return toArray<LookupItem>(unwrap(res.data));
}

export async function shifts(): Promise<LookupItem[]> {
  const res = await api.get('/shifts');
  return toArray<LookupItem>(unwrap(res.data));
}

export async function workLocations(): Promise<LookupItem[]> {
  const res = await api.get('/work-locations');
  return toArray<LookupItem>(unwrap(res.data));
}

export async function holidays(): Promise<Holiday[]> {
  const res = await api.get('/holidays');
  return toArray<Holiday>(unwrap(res.data));
}

export async function policies(): Promise<Policy[]> {
  const res = await api.get('/policies');
  return toArray<Policy>(unwrap(res.data));
}

export async function acceptPolicy(id: number): Promise<void> {
  await api.post(`/policies/${id}/accept`);
}

export async function health(): Promise<any> {
  const res = await api.get('/health');
  return unwrap(res.data);
}

/* --------------------------------- Version --------------------------------- */

export interface VersionInfo {
  platform?: string;
  current_version?: string | null;
  latest_version?: string;
  min_supported_version?: string;
  force_update?: boolean;
  update_available?: boolean;
  store_url?: string;
  message?: string;
}

/** App version / update info for this platform. */
export async function appVersion(): Promise<VersionInfo> {
  const res = await api.get('/version', { params: { platform: 'android' } });
  return unwrap<VersionInfo>(res.data);
}
