import { ensureCompatibleAgentServer } from "../agent-server-compatibility";
import { createLlmMetadataClient } from "../typescript-client";
import { ModelsResponse, WebClientConfig } from "./option.types";

class OptionService {
  static async getModels(): Promise<ModelsResponse> {
    const llmClient = createLlmMetadataClient();
    const [models, verifiedByProvider, providers] = await Promise.all([
      llmClient.getModels(),
      llmClient.getVerifiedModels(),
      llmClient.getProviders(),
    ]);

    const verifiedProviders = Object.keys(verifiedByProvider ?? {}).sort();
    const verifiedModels = verifiedProviders.flatMap(
      (provider) => verifiedByProvider[provider] ?? [],
    );

    return {
      models: models ?? [],
      verified_models: verifiedModels,
      verified_providers:
        providers?.filter((provider) => verifiedProviders.includes(provider)) ??
        verifiedProviders,
      default_model: verifiedModels[0] ?? models?.[0] ?? "",
    };
  }

  static async getSecurityAnalyzers(): Promise<string[]> {
    return ["llm", "pattern", "policy_rail"];
  }

  static async getConfig(): Promise<WebClientConfig> {
    await ensureCompatibleAgentServer();

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
