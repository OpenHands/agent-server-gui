import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsDropdownInput } from "#/components/features/settings/settings-dropdown-input";
import { I18nKey } from "#/i18n/declaration";
import { mapProvider } from "#/utils/map-provider";
import { extractModelAndProvider } from "#/utils/extract-model-and-provider";
import { cn } from "#/utils/utils";
import { HelpLink } from "#/ui/help-link";
import { PRODUCT_URL } from "#/utils/constants";
import { useSearchProviders } from "#/hooks/query/use-search-providers";
import { useProviderModels } from "#/hooks/query/use-provider-models";

interface ModelSelectorProps {
  isDisabled?: boolean;
  currentModel?: string;
  onChange?: (provider: string | null, model: string | null) => void;
  onDefaultValuesChanged?: (
    provider: string | null,
    model: string | null,
  ) => void;
  wrapperClassName?: string;
  labelClassName?: string;
}

export function ModelSelector({
  isDisabled,
  currentModel,
  onChange,
  onDefaultValuesChanged,
  wrapperClassName,
  labelClassName,
}: ModelSelectorProps) {
  const [selectedProvider, setSelectedProvider] = React.useState<string | null>(
    null,
  );
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null);

  const { data: providers = [] } = useSearchProviders();
  const {
    data: providerModels = [],
    isLoading: isLoadingModels,
    error: modelsError,
  } = useProviderModels(selectedProvider);

  React.useEffect(() => {
    if (!currentModel) {
      return;
    }

    const { provider, model } = extractModelAndProvider(currentModel);
    setSelectedProvider(provider || null);
    setSelectedModel(model);
    onDefaultValuesChanged?.(provider || null, model);
  }, [currentModel, onDefaultValuesChanged]);

  const providerItems = React.useMemo(
    () =>
      [...providers]
        .sort((left, right) => Number(right.verified) - Number(left.verified))
        .map((provider) => ({
          key: provider.name,
          label: mapProvider(provider.name),
        })),
    [providers],
  );

  const modelItems = React.useMemo(
    () =>
      [...providerModels]
        .sort((left, right) => Number(right.verified) - Number(left.verified))
        .map((model) => ({
          key: model.name,
          label: model.name,
        })),
    [providerModels],
  );

  const handleChangeProvider = (provider: string | null) => {
    setSelectedProvider(provider);
    setSelectedModel(null);
    onChange?.(provider, null);
  };

  const handleChangeModel = (model: string | null) => {
    setSelectedModel(model);
    onChange?.(selectedProvider, model);
  };

  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row w-full max-w-[680px] justify-between gap-4 md:gap-[46px]",
        wrapperClassName,
      )}
    >
      <fieldset className="flex flex-col gap-2.5 w-full">
        <SettingsDropdownInput
          testId="llm-provider-input"
          name="llm-provider-input"
          label={<span className={cn("text-sm", labelClassName)}>{t(I18nKey.LLM$PROVIDER)}</span>}
          items={providerItems}
          isDisabled={isDisabled}
          placeholder={t(I18nKey.LLM$SELECT_PROVIDER_PLACEHOLDER)}
          selectedKey={selectedProvider ?? undefined}
          onSelectionChange={(key) => handleChangeProvider(key?.toString() ?? null)}
          onInputChange={(value) => {
            if (!value) {
              handleChangeProvider(null);
            }
          }}
        />
      </fieldset>

      {selectedProvider === "openhands" && (
        <HelpLink
          testId="openhands-account-help"
          text={t(I18nKey.SETTINGS$NEED_OPENHANDS_ACCOUNT)}
          linkText={t(I18nKey.SETTINGS$CLICK_HERE)}
          href={PRODUCT_URL.PRODUCTION}
          size="settings"
          linkColor="white"
        />
      )}

      <fieldset className="flex flex-col gap-2.5 w-full">
        <SettingsDropdownInput
          testId="llm-model-input"
          name="llm-model-input"
          label={<span className={cn("text-sm", labelClassName)}>{t(I18nKey.LLM$MODEL)}</span>}
          items={modelItems}
          isDisabled={isDisabled || !selectedProvider}
          isLoading={isLoadingModels}
          placeholder={t(I18nKey.LLM$SELECT_MODEL_PLACEHOLDER)}
          selectedKey={selectedModel ?? undefined}
          onSelectionChange={(key) => handleChangeModel(key?.toString() ?? null)}
        />
        {modelsError && (
          <p data-testid="models-error" className="text-danger text-xs">
            {t(I18nKey.CONFIGURATION$ERROR_FETCH_MODELS)}
          </p>
        )}
      </fieldset>
    </div>
  );
}
