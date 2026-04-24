import { openHands } from "../open-hands-axios";
import { ModelsResponse, WebClientConfig } from "./option.types";

class OptionService {
  static async getModels(): Promise<ModelsResponse> {
    const [modelsResponse, verifiedResponse, providersResponse] =
      await Promise.all([
        openHands.get<{ models: string[] }>("/api/llm/models"),
        openHands.get<{ models: Record<string, string[]> }>(
          "/api/llm/models/verified",
        ),
        openHands.get<{ providers: string[] }>("/api/llm/providers"),
      ]);

    const verifiedProviders = Object.keys(verifiedResponse.data.models ?? {}).sort();
    const verifiedModels = verifiedProviders.flatMap(
      (provider) => verifiedResponse.data.models[provider] ?? [],
    );

    return {
      models: modelsResponse.data.models ?? [],
      verified_models: verifiedModels,
      verified_providers:
        providersResponse.data.providers?.filter((provider) =>
          verifiedProviders.includes(provider),
        ) ?? verifiedProviders,
      default_model: verifiedModels[0] ?? modelsResponse.data.models?.[0] ?? "",
    };
  }

  static async getSecurityAnalyzers(): Promise<string[]> {
    return ["llm", "pattern", "policy_rail"];
  }

  static async getConfig(): Promise<WebClientConfig> {
    await openHands.get("/server_info");

    return {
      app_mode: "oss",
      posthog_client_key: null,
      feature_flags: {
        enable_billing: false,
        hide_llm_settings: false,
        enable_jira: false,
        enable_jira_dc: false,
        enable_linear: false,
        hide_users_page: true,
        hide_billing_page: true,
        hide_integrations_page: true,
        deployment_mode: "self_hosted",
      },
      providers_configured: [],
      maintenance_start_time: null,
      auth_url: null,
      recaptcha_site_key: null,
      faulty_models: [],
      error_message: null,
      updated_at: new Date().toISOString(),
      github_app_slug: null,
    };
  }
}

export default OptionService;
