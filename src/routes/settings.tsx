import { useMemo } from "react";
import { Outlet, redirect, useLocation, useMatches } from "react-router";
import { useTranslation } from "react-i18next";
import { Route } from "./+types/settings";
import OptionService from "#/api/option-service/option-service.api";
import { queryClient } from "#/query-client-config";
import { SettingsLayout } from "#/components/features/settings";
import { WebClientConfig } from "#/api/option-service/option.types";
import { QUERY_KEYS, CONFIG_CACHE_OPTIONS } from "#/hooks/query/query-keys";
import { Typography } from "#/ui/typography";
import { useSettingsNavItems } from "#/hooks/use-settings-nav-items";
import {
  isSettingsPageHidden,
  getFirstAvailablePath,
} from "#/utils/settings-utils";

export const clientLoader = async ({ request }: Route.ClientLoaderArgs) => {
  const url = new URL(request.url);
  const { pathname } = url;

  const config = await queryClient.fetchQuery<WebClientConfig>({
    queryKey: QUERY_KEYS.WEB_CLIENT_CONFIG,
    queryFn: OptionService.getConfig,
    ...CONFIG_CACHE_OPTIONS,
  });

  const featureFlags = config?.feature_flags;

  if (isSettingsPageHidden(pathname, featureFlags)) {
    const fallbackPath = getFirstAvailablePath(false, featureFlags);
    if (fallbackPath && fallbackPath !== pathname) {
      return redirect(fallbackPath);
    }
  }

  return null;
};

function SettingsScreen() {
  const { t } = useTranslation();
  const location = useLocation();
  const matches = useMatches();
  const navItems = useSettingsNavItems();

  const currentSectionTitle = useMemo(() => {
    const currentRenderedItem = navItems.find(
      (item) => item.item.to === location.pathname,
    );
    if (currentRenderedItem) {
      return currentRenderedItem.item.text;
    }
    return navItems[0]?.item.text ?? "SETTINGS$TITLE";
  }, [navItems, location.pathname]);

  const routeHandle = matches.find((m) => m.pathname === location.pathname)
    ?.handle as { hideTitle?: boolean } | undefined;
  const shouldHideTitle = routeHandle?.hideTitle === true;

  return (
    <main data-testid="settings-screen" className="h-full">
      <SettingsLayout navigationItems={navItems}>
        <div className="flex flex-col gap-6 h-full">
          {!shouldHideTitle && <Typography.H2>{t(currentSectionTitle)}</Typography.H2>}
          <div className="flex-1 overflow-auto custom-scrollbar-always">
            <Outlet />
          </div>
        </div>
      </SettingsLayout>
    </main>
  );
}

export default SettingsScreen;
