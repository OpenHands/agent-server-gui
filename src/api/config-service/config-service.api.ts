import { createLlmMetadataClient } from "../typescript-client";
import type {
  LLMModel,
  LLMModelPage,
  LLMProvider,
  ProviderPage,
  SearchModelsParams,
  SearchProvidersParams,
} from "./config-service.types";

function filterByQuery<T extends { name: string }>(items: T[], query?: string): T[] {
  if (!query) {
    return items;
  }

  const normalizedQuery = query.toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(normalizedQuery));
}

function filterByVerified<T extends { verified: boolean }>(
  items: T[],
  verified?: boolean,
): T[] {
  if (verified === undefined) {
    return items;
  }

  return items.filter((item) => item.verified === verified);
}

function limitItems<T>(items: T[], limit?: number): T[] {
  if (!limit || limit <= 0) {
    return items;
  }

  return items.slice(0, limit);
}

class ConfigService {
  static async searchModels(
    params: SearchModelsParams = {},
  ): Promise<LLMModelPage> {
    const llmClient = createLlmMetadataClient();
    const [models, verifiedByProvider] = await Promise.all([
      llmClient.getModels(),
      llmClient.getVerifiedModels(),
    ]);

    const provider = params.provider__eq ?? null;
    const verifiedNames = new Set(provider ? (verifiedByProvider?.[provider] ?? []) : []);
    const verifiedItems: LLMModel[] = [...verifiedNames].map((name) => ({
      provider,
      name,
      verified: true,
    }));

    const prefixedItems: LLMModel[] = provider
      ? (models ?? [])
          .filter((model) => model.startsWith(`${provider}/`))
          .map((model) => model.slice(provider.length + 1))
          .filter((name) => name.length > 0 && !verifiedNames.has(name))
          .map((name) => ({
            provider,
            name,
            verified: false,
          }))
      : [];

    const items = limitItems(
      filterByVerified(
        filterByQuery([...verifiedItems, ...prefixedItems], params.query),
        params.verified__eq,
      ),
      params.limit,
    );

    return {
      items,
      next_page_id: null,
    };
  }

  static async searchProviders(
    params: SearchProvidersParams = {},
  ): Promise<ProviderPage> {
    const llmClient = createLlmMetadataClient();
    const [providers, verifiedByProvider] = await Promise.all([
      llmClient.getProviders(),
      llmClient.getVerifiedModels(),
    ]);

    const verifiedProviders = new Set(Object.keys(verifiedByProvider ?? {}));
    const providerItems: LLMProvider[] = (providers ?? []).map((name) => ({
      name,
      verified: verifiedProviders.has(name),
    }));

    const items = limitItems(
      filterByVerified(filterByQuery(providerItems, params.query), params.verified__eq),
      params.limit,
    );

    return {
      items,
      next_page_id: null,
    };
  }
}

export default ConfigService;
