import { SkillInfo } from "#/types/settings";
import { getAgentServerWorkingDir } from "./agent-server-config";
import { createSkillsClient } from "./typescript-client";

class SkillsService {
  static async getSkills(): Promise<SkillInfo[]> {
    const response = await createSkillsClient().getSkills({
      load_public: true,
      load_user: true,
      load_project: true,
      load_org: false,
      project_dir: getAgentServerWorkingDir(),
    });

    return (response.skills ?? []) as SkillInfo[];
  }
}

export default SkillsService;
