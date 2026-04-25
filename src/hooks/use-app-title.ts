import { useParams } from "react-router";
import { useUserConversation } from "#/hooks/query/use-user-conversation";

const APP_TITLE = "OpenHands";

export const useAppTitle = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: conversation } = useUserConversation(conversationId ?? null);
  const conversationTitle = conversation?.title;

  if (conversationId && conversationTitle) {
    return `${conversationTitle} | ${APP_TITLE}`;
  }

  return APP_TITLE;
};
