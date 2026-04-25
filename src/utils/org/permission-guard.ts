import { PermissionKey } from "./permissions";

export const createPermissionGuard =
  (_requiredPermission: PermissionKey, _customRedirectPath?: string) =>
  async () =>
    null;
