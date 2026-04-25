import {
  SETTINGS_NAV_ITEMS,
  SettingsNavItem,
} from "#/constants/settings-nav";
import { isSettingsPageHidden } from "#/utils/settings-utils";
import { useConfig } from "./query/use-config";
import { I18nKey } from "#/i18n/declaration";

export type SettingsNavRenderedItem =
  | { type: "item"; item: SettingsNavItem }
  | { type: "header"; text: I18nKey }
  | { type: "divider" };

export function useSettingsNavItems(): SettingsNavRenderedItem[] {
  const { data: config } = useConfig();
  const featureFlags = config?.feature_flags;

  return SETTINGS_NAV_ITEMS.filter(
    (item) => !isSettingsPageHidden(item.to, featureFlags),
  ).map((item) => ({ type: "item", item }));
}
