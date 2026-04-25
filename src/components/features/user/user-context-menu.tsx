import { useTranslation } from "react-i18next";
import { IoLogOutOutline } from "react-icons/io5";
import { useLogout } from "#/hooks/mutation/use-logout";
import { cn } from "#/utils/utils";
import { I18nKey } from "#/i18n/declaration";
import { useSettingsNavItems } from "#/hooks/use-settings-nav-items";
import DocumentIcon from "#/icons/document.svg?react";
import { ContextMenuListItem } from "../context-menu/context-menu-list-item";
import { ContextMenuContainer } from "../context-menu/context-menu-container";
import { ContextMenuNavLink } from "../context-menu/context-menu-nav-link";
import { SettingsNavDivider } from "../settings/settings-nav-divider";

const contextMenuListItemClassName = cn(
  "flex items-center gap-2 p-2 h-auto hover:bg-white/10 hover:text-white rounded text-xs",
);

interface UserContextMenuProps {
  onClose: () => void;
}

export function UserContextMenu({ onClose }: UserContextMenuProps) {
  const { t } = useTranslation();
  const { mutate: logout } = useLogout();
  const navItems = useSettingsNavItems();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <ContextMenuContainer testId="user-context-menu" onClose={onClose}>
      <div className="flex flex-col gap-3 w-[248px]">
        <h3 className="text-lg font-semibold text-white">
          {t(I18nKey.ORG$ACCOUNT)}
        </h3>

        <div className="flex flex-col items-start gap-0 w-full">
          {navItems
            .filter(
              (
                renderedItem,
              ): renderedItem is Extract<typeof renderedItem, { type: "item" }> =>
                renderedItem.type === "item",
            )
            .map((renderedItem) => (
              <ContextMenuNavLink
                key={renderedItem.item.to}
                item={renderedItem.item}
                onClick={onClose}
              />
            ))}

          <SettingsNavDivider className="my-1.5" />

          <a
            href="https://docs.openhands.dev"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-2 p-2 cursor-pointer hover:bg-white/10 hover:text-white rounded w-full text-xs"
          >
            <DocumentIcon className="text-white" width={16} height={16} />
            {t(I18nKey.SIDEBAR$DOCS)}
          </a>

          <ContextMenuListItem
            onClick={handleLogout}
            className={contextMenuListItemClassName}
          >
            <IoLogOutOutline className="text-white" size={16} />
            {t(I18nKey.ACCOUNT_SETTINGS$LOGOUT)}
          </ContextMenuListItem>
        </div>
      </div>
    </ContextMenuContainer>
  );
}
