/**
 * The installed app's version. Keep this in sync with `versionName` in
 * android/app/build.gradle. The version-check API compares its `latest_version`
 * against this value to decide whether an update is available.
 */
export const APP_VERSION = '1.0.0';

/**
 * Compare two dotted version strings.
 * Returns >0 if a > b, <0 if a < b, 0 if equal. Missing parts count as 0.
 */
export function compareVersions(a?: string | null, b?: string | null): number {
  const pa = String(a ?? '').split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b ?? '').split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}
