import React from "react";
import {
  useRouteError,
  isRouteErrorResponse,
  Outlet,
  useLocation,
} from "react-router";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import i18n from "#/i18n";
import { useConfig } from "#/hooks/query/use-config";
import { Sidebar } from "#/components/features/sidebar/sidebar";
import { AnalyticsConsentFormModal } from "#/components/features/analytics/analytics-consent-form-modal";
import { useSettings } from "#/hooks/query/use-settings";
import { useMigrateUserConsent } from "#/hooks/use-migrate-user-consent";
import { useIsOnIntermediatePage } from "#/hooks/use-is-on-intermediate-page";
import { AlertBanner } from "#/components/features/alerts/alert-banner";
import { cn } from "#/utils/utils";
import { useAppTitle } from "#/hooks/use-app-title";

export function ErrorBoundary() {
  const error = useRouteError();
  const { t } = useTranslation();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status}</h1>
        <p>{error.statusText}</p>
        <pre>
          {error.data instanceof Object
            ? JSON.stringify(error.data)
            : error.data}
        </pre>
      </div>
    );
  }
  if (error instanceof Error) {
    return (
      <div>
        <h1>{t(I18nKey.ERROR$GENERIC)}</h1>
        <pre>{error.message}</pre>
      </div>
    );
  }

  return (
    <div>
      <h1>{t(I18nKey.ERROR$UNKNOWN)}</h1>
    </div>
  );
}

export default function MainApp() {
  const appTitle = useAppTitle();
  const { pathname } = useLocation();
  const isOnIntermediatePage = useIsOnIntermediatePage();
  const { data: settings } = useSettings();
  const { migrateUserConsent } = useMigrateUserConsent();
  const { data: config } = useConfig();
  const [consentFormIsOpen, setConsentFormIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isOnIntermediatePage && settings?.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [isOnIntermediatePage, settings?.language]);

  React.useEffect(() => {
    if (!isOnIntermediatePage) {
      setConsentFormIsOpen(settings?.user_consents_to_analytics === null);
    }
  }, [isOnIntermediatePage, settings?.user_consents_to_analytics]);

  React.useEffect(() => {
    if (!isOnIntermediatePage) {
      migrateUserConsent({
        handleAnalyticsWasPresentInLocalStorage: () => {
          setConsentFormIsOpen(false);
        },
      });
    }
  }, [isOnIntermediatePage, migrateUserConsent]);

  return (
    <div
      data-testid="root-layout"
      className={cn(
        "h-screen lg:min-w-5xl flex flex-col md:flex-row bg-base overflow-hidden",
        pathname === "/" ? "p-0" : "p-0 md:p-3 md:pl-0",
      )}
    >
      <title>{appTitle}</title>
      <Sidebar />

      <div className="flex flex-col w-full h-[calc(100%-50px)] md:h-full gap-3">
        {config &&
          (config.maintenance_start_time ||
            (config.faulty_models && config.faulty_models.length > 0) ||
            config.error_message) && (
            <AlertBanner
              maintenanceStartTime={config.maintenance_start_time}
              faultyModels={config.faulty_models}
              errorMessage={config.error_message}
              updatedAt={config.updated_at}
            />
          )}
        <div
          id="root-outlet"
          className="flex-1 relative overflow-auto custom-scrollbar"
        >
          <Outlet />
        </div>
      </div>

      {consentFormIsOpen && (
        <AnalyticsConsentFormModal
          onClose={() => {
            setConsentFormIsOpen(false);
          }}
        />
      )}
    </div>
  );
}
