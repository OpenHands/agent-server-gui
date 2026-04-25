import {
  Links,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import "./tailwind.css";
import "./index.css";
import React from "react";
import { Toaster } from "react-hot-toast";
import {
  AgentServerIncompatibilityError,
  AgentServerUnavailableError,
  isAgentServerIncompatibilityError,
  isAgentServerUnavailableError,
} from "#/api/agent-server-compatibility";
import { useConfig } from "#/hooks/query/use-config";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster />
        <div id="modal-portal-exit" />
      </body>
    </html>
  );
}

function AgentServerNotice({
  testId,
  title,
  message,
  children,
}: {
  testId: string;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-base p-6 text-white">
      <div
        data-testid={testId}
        className="w-full max-w-2xl rounded-2xl border border-danger/30 bg-neutral-900/80 p-8 shadow-2xl"
      >
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-danger">
          Connection blocked
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-4 text-base leading-7 text-neutral-200">{message}</p>
        {children}
      </div>
    </main>
  );
}

function UnsupportedAgentServerNotice({
  error,
}: {
  error: AgentServerIncompatibilityError;
}) {
  return (
    <AgentServerNotice
      testId="agent-server-incompatibility-warning"
      title="Unsupported agent server version"
      message={error.message}
    >
      {error.serverVersion && (
        <p className="mt-4 text-sm text-neutral-400">
          Detected version: <code>{error.serverVersion}</code>
        </p>
      )}
    </AgentServerNotice>
  );
}

function MissingAgentServerNotice({
  error,
}: {
  error: AgentServerUnavailableError;
}) {
  return (
    <AgentServerNotice
      testId="agent-server-unavailable-warning"
      title="Agent server not found"
      message={error.message}
    >
      {error.details && (
        <p className="mt-4 text-sm text-neutral-400">
          Details: {error.details}
        </p>
      )}
    </AgentServerNotice>
  );
}

export const meta: MetaFunction = () => [
  { title: "OpenHands" },
  { name: "description", content: "Let's Start Building!" },
];

export default function App() {
  const config = useConfig({ enabled: true });

  if (isAgentServerUnavailableError(config.error)) {
    return <MissingAgentServerNotice error={config.error} />;
  }

  if (isAgentServerIncompatibilityError(config.error)) {
    return <UnsupportedAgentServerNotice error={config.error} />;
  }

  return <Outlet />;
}
