import { useMemo } from "react";
import { useUserProviders } from "./use-user-providers";
import { useIsAuthed } from "./query/use-is-authed";

export const useShouldShowUserFeatures = () => {
  const { data: isAuthed } = useIsAuthed();
  const { providers } = useUserProviders();

  return useMemo(() => Boolean(isAuthed && providers.length > 0), [
    isAuthed,
    providers.length,
  ]);
};
