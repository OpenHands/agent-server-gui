interface SetOrganizationIdOptions {
  skipRevalidation?: boolean;
}

export const useSelectedOrganizationId = () => {
  const setOrganizationId = (
    _newOrganizationId: string | null,
    _options?: SetOrganizationIdOptions,
  ) => {};

  return { organizationId: null as string | null, setOrganizationId };
};
