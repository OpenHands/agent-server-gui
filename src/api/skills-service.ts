import { openHands } from "./open-hands-axios";
import { SkillInfo } from "#/types/settings";
import { getAgentServerWorkingDir } from "./agent-server-config";

class SkillsService {
  static async getSkills(): Promise<SkillInfo[]> {
    const { data } = await openHands.post<{ skills: SkillInfo[] }>("/api/skills", {
      load_public: true,
      load_user: true,
      load_project: true,
      load_org: false,
      project_dir: getAgentServerWorkingDir(),
    });
    return data.skills ?? [];
  }
}

export default SkillsService;
