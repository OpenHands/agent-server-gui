import { SdkSectionPage } from "#/components/features/settings/sdk-settings/sdk-section-page";

function CondenserSettingsScreen() {
  return (
    <SdkSectionPage
      sectionKeys={["condenser"]}
      testId="condenser-settings-screen"
    />
  );
}

export default CondenserSettingsScreen;
