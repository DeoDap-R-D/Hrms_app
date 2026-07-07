import type { NavigatorScreenParams } from '@react-navigation/native';

export type LookupKind =
  | 'departments'
  | 'designations'
  | 'shifts'
  | 'work-locations'
  | 'holidays';

export type AppTabParamList = {
  Home: undefined;
  Attendance: undefined;
  Leave: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList>;
  Punch: { type?: 'in' | 'out' } | undefined;
  PunchHistory: undefined;
  CreateLeave: undefined;
  LeaveDetail: { id: number };
  WorkReports: undefined;
  CreateWorkReport: undefined;
  DailyReport: undefined;
  MonthlyReport: undefined;
  PeriodicReport: undefined;
  ReportViewer: { type: string; date: string; to?: string; period?: 'daily' | 'monthly' | 'periodic' };
  PeriodicReportViewer: { type: string; from: string; to: string };
  YearlyReport: undefined;
  YearlyReportViewer: { type: string; from: string; to: string };
  ContactSupport: undefined;
  Notifications: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Tracking: undefined;
  Policies: undefined;
  Departments: undefined;
  Lookup: { kind: LookupKind; title: string };
};

export type RootStackParamList = AppStackParamList;
