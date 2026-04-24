import type {
  GitChangeStatus,
  V1GitChangeStatus,
} from "#/api/open-hands.types";

type ClientGitChangeStatus = "added" | "modified" | "deleted" | "renamed";

type SupportedGitStatus = V1GitChangeStatus | ClientGitChangeStatus;

export function mapAnyGitStatusToV0Status(status: SupportedGitStatus): GitChangeStatus {
  switch (status) {
    case "ADDED":
    case "added":
      return "A";
    case "DELETED":
    case "deleted":
      return "D";
    case "UPDATED":
    case "modified":
      return "M";
    case "MOVED":
    case "renamed":
      return "R";
    default:
      return "M";
  }
}

export function mapV1ToV0Status(v1Status: V1GitChangeStatus): GitChangeStatus {
  return mapAnyGitStatusToV0Status(v1Status);
}
