import { useEffect, useState } from 'react';
import * as svc from '../api/services';
import { APP_VERSION, compareVersions } from '../config/version';

export interface UpdateState {
  visible: boolean;
  force: boolean;
  latest: string;
  storeUrl: string;
  message: string;
}

const HIDDEN: UpdateState = { visible: false, force: false, latest: '', storeUrl: '', message: '' };

/**
 * Checks the version API on mount. Shows an update prompt when the API's
 * `latest_version` is newer than the installed {@link APP_VERSION}. If the API
 * flags `force_update` (or the installed version is below `min_supported_version`)
 * the prompt is non-dismissible.
 */
export function useAppUpdate(): [UpdateState, () => void] {
  const [state, setState] = useState<UpdateState>(HIDDEN);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const info = await svc.appVersion();
        if (!active) return;

        const latest = info.latest_version ?? '';
        const min = info.min_supported_version ?? '';
        const updateAvailable = !!info.update_available || (!!latest && compareVersions(latest, APP_VERSION) > 0);
        const force = !!info.force_update || (!!min && compareVersions(min, APP_VERSION) > 0);

        if (updateAvailable || force) {
          setState({
            visible: true,
            force,
            latest,
            storeUrl: info.store_url ?? '',
            message: info.message ?? '',
          });
        }
      } catch {
        // Never block the app if the version check fails (offline, etc.).
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const dismiss = () => setState(s => ({ ...s, visible: false }));
  return [state, dismiss];
}
