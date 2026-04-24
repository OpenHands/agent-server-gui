import { openHands } from "../open-hands-axios";
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
    const [modelsResponse, verifiedResponse] = await Promise.all([
      openHands.get<{ models: string[] }>("/api/llm/models"),
      openHands.get<{ models: Record<string, string[]> }>(
        "/api/llm/models/verified",
      ),
    ]);

    const provider = params.provider__eq ?? null;
    const verifiedNames = new Set(
      provider ? (verifiedResponse.data.models?.[provider] ?? []) : [],
    );
    const verifiedItems: LLMModel[] = [...verifiedNames].map((name) => ({
      provider,
      name,
      verified: true,
    }));

    const prefixedItems: LLMModel[] = provider
      ? (modelsResponse.data.models ?? [])
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
    const [providersResponse, verifiedResponse] = await Promise.all([
      openHands.get<{ providers: string[] }>("/api/llm/providers"),
      openHands.get<{ models: Record<string, string[]> }>(
        "/api/llm/models/verified",
      ),
    ]);

    const verifiedProviders = new Set(
      Object.keys(verifiedResponse.data.models ?? {}),
    );
    const providers: LLMProvider[] = (providersResponse.data.providers ?? []).map(
      (name) => ({
        name,
        verified: verifiedProviders.has(name),
      }),
    );

    const items = limitItems(
      filterByVerified(filterByQuery(providers, params.query), params.verified__eq),
      params.limit,
    );

    return {
      items,
      next_page_id: null,
    };
  }
}

export default ConfigService;
