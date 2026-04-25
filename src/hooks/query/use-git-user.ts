import { useQuery } from "@tanstack/react-query";
import React from "react";
import { usePostHog } from "posthog-js/react";
import { useConfig } from "./use-config";
import UserService from "#/api/user-service/user-service.api";
import { useShouldShowUserFeatures } from "#/hooks/use-should-show-user-features";

export const useGitUser = () => {
  const posthog = usePostHog();
  const { data: config } = useConfig();
  const shouldFetchUser = useShouldShowUserFeatures();

  const user = useQuery({
    queryKey: ["user"],
    queryFn: UserService.getUser,
    enabled: shouldFetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  React.useEffect(() => {
    if (user.data) {
      posthog.identify(user.data.login, {
        company: user.data.company,
        name: user.data.name,
        email: user.data.email,
        user: user.data.login,
        mode: config?.app_mode || "oss",
      });
    }
  }, [config?.app_mode, posthog, user.data]);

  return user;
};
