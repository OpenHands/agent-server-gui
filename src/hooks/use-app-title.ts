import { useEffect } from "react";

const APP_TITLE = "OpenHands";

export const useAppTitle = () => {
  useEffect(() => {
    document.title = APP_TITLE;
  }, []);

  return APP_TITLE;
};
