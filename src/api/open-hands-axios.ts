import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { getAgentServerBaseUrl, getAgentServerHeaders } from "./agent-server-config";

export const openHands = axios.create({
  baseURL: getAgentServerBaseUrl(),
});

openHands.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headers = getAgentServerHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    config.headers.set(key, value);
  });
  return config;
});

// Helper function to check if a response contains an email verification error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const checkForEmailVerificationError = (data: any): boolean => {
  const EMAIL_NOT_VERIFIED = "EmailNotVerifiedError";

  if (typeof data === "string") {
    return data.includes(EMAIL_NOT_VERIFIED);
  }

  if (typeof data === "object" && data !== null) {
    if ("message" in data) {
      const { message } = data;
      if (typeof message === "string") {
        return message.includes(EMAIL_NOT_VERIFIED);
      }
      if (Array.isArray(message)) {
        return message.some(
          (msg) => typeof msg === "string" && msg.includes(EMAIL_NOT_VERIFIED),
        );
      }
    }

    return Object.values(data).some(
      (value) =>
        (typeof value === "string" && value.includes(EMAIL_NOT_VERIFIED)) ||
        (Array.isArray(value) &&
          value.some(
            (v) => typeof v === "string" && v.includes(EMAIL_NOT_VERIFIED),
          )),
    );
  }

  return false;
};

openHands.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 403 &&
      checkForEmailVerificationError(error.response?.data)
    ) {
      if (window.location.pathname !== "/settings/user") {
        window.location.reload();
      }
    }

    return Promise.reject(error);
  },
);
