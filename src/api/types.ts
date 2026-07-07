/**
 * Loose types for API entities. The backend envelope is { status, message, data }.
 * Fields are intentionally permissive because the live schema may vary; UI code
 * reads defensively via helpers in utils/format.
 */

export interface Employee {
  id?: number;
  code?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  username?: string;
  dob?: string;
  gender?: number;
  image?: string;
  avatar?: string;
  department?: string | { name?: string };
  designation?: string | { name?: string };
  shift?: string | { name?: string };
  department_id?: number | null;
  designation_id?: number | null;
  shift_id?: number | null;
  work_location_id?: number | null;
  img?: string;
  terms_accepted?: boolean | number;
  is_terms_accepted?: boolean | number;
  [key: string]: any;
}

export interface PunchStatus {
  /** "punched_in" | "punched_out" */
  state?: string;
  /** Today's attendance record. */
  punch?: PunchRecord;
  message?: string;
  [key: string]: any;
}

/**
 * A daily attendance record. The API returns one row per day with in/out
 * clock strings and duration totals — not discrete in/out punch events.
 */
export interface PunchRecord {
  id?: number;
  employee_code?: string;
  name?: string;
  date?: string;
  intime?: string | null; // "HH:mm:ss"
  outtime?: string | null; // "HH:mm:ss"
  worktime?: string; // "HH:mm:ss"
  overtime?: string;
  breaktime?: string;
  late_in?: string;
  erl_out?: string;
  status?: string; // "P" | "A" | "L" | ...
  remark?: string | null;
  note?: string | null;
  reason?: string | null;
  proof?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface Leave {
  id?: number;
  leave_date_from?: string;
  leave_date_to?: string;
  reason_for_leave?: string;
  total_leave_days?: string | number;
  status?: string | number;
  leave_time_from?: string;
  leave_time_to?: string;
  created_at?: string;
  [key: string]: any;
}

export interface WorkReport {
  id?: number;
  date?: string;
  task?: string;
  outcome?: string;
  wr_time?: number | string;
  report_type?: string;
  remarks?: string;
  screen_shot?: string;
  submit_time?: string; // "HH:mm:ss" — when the entry was logged
  created_at?: string;
  [key: string]: any;
}

export interface NotificationItem {
  id?: number | string;
  title?: string;
  message?: string;
  body?: string;
  read_at?: string | null;
  is_read?: boolean | number;
  created_at?: string;
  [key: string]: any;
}

export interface LookupItem {
  id?: number;
  name?: string;
  title?: string;
  label?: string;
  [key: string]: any;
}

export interface Holiday extends LookupItem {
  date?: string;
  holiday_date?: string;
}

export interface Policy extends LookupItem {
  description?: string;
  content?: string;
  accepted?: boolean | number;
}

export interface TrackingType extends LookupItem {}

export interface WorkReportTime {
  id?: number;
  time?: string;
  label?: string;
  slot?: string;
  [key: string]: any;
}
