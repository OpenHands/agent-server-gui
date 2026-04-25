import React from "react";
import { UserAvatar } from "./user-avatar";
import { UserContextMenu } from "../user/user-context-menu";
import { cn } from "#/utils/utils";

interface UserActionsProps {
  user?: { avatar_url: string };
  isLoading?: boolean;
}

export function UserActions({ user, isLoading }: UserActionsProps) {
  const [accountContextMenuIsVisible, setAccountContextMenuIsVisible] =
    React.useState(false);
  const [menuResetCount, setMenuResetCount] = React.useState(0);
  const hideTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    },
    [],
  );

  const showAccountMenu = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setAccountContextMenuIsVisible(true);
  };

  const hideAccountMenu = () => {
    hideTimeoutRef.current = window.setTimeout(() => {
      setAccountContextMenuIsVisible(false);
      setMenuResetCount((count) => count + 1);
    }, 500);
  };

  const closeAccountMenu = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (accountContextMenuIsVisible) {
      setAccountContextMenuIsVisible(false);
      setMenuResetCount((count) => count + 1);
    }
  };

  return (
    <div
      data-testid="user-actions"
      className="relative cursor-pointer group"
      onMouseEnter={showAccountMenu}
      onMouseLeave={hideAccountMenu}
    >
      <UserAvatar avatarUrl={user?.avatar_url} isLoading={isLoading} />

      <div
        className={cn(
          "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
          accountContextMenuIsVisible && "opacity-100 pointer-events-auto",
        )}
      >
        <UserContextMenu key={menuResetCount} onClose={closeAccountMenu} />
      </div>
    </div>
  );
}
