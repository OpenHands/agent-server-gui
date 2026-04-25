import { useQuery } from "@tanstack/react-query";
import { useIsOnIntermediatePage } from "#/hooks/use-is-on-intermediate-page";

export const useIsAuthed = () => {
  const isOnIntermediatePage = useIsOnIntermediatePage();

  return useQuery({
    queryKey: ["user", "authenticated", "oss"],
    queryFn: async () => true,
    enabled: !isOnIntermediatePage,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: false,
    meta: {
      disableToast: true,
    },
  });
};
