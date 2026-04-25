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
  isAgentServerIncompatibilityError,
} from "#/api/agent-server-compatibility";
import { useConfig } from "#/hooks/query/use-config";
import { useInvitation } from "#/hooks/use-invitation";

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

function UnsupportedAgentServerNotice({
  error,
}: {
  error: AgentServerIncompatibilityError;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-base p-6 text-white">
      <div
        data-testid="agent-server-incompatibility-warning"
        className="w-full max-w-2xl rounded-2xl border border-danger/30 bg-neutral-900/80 p-8 shadow-2xl"
      >
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-danger">
          Connection blocked
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Unsupported agent server version
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-200">
          {error.message}
        </p>
        {error.serverVersion && (
          <p className="mt-4 text-sm text-neutral-400">
            Detected version: <code>{error.serverVersion}</code>
          </p>
        )}
      </div>
    </main>
  );
}

export const meta: MetaFunction = () => [
  { title: "OpenHands" },
  { name: "description", content: "Let's Start Building!" },
];

export default function App() {
  const config = useConfig({ enabled: true });

  // Handle invitation token cleanup when invitation flow completes
  // This runs on all pages to catch redirects from auth callback
  useInvitation();

  if (isAgentServerIncompatibilityError(config.error)) {
    return <UnsupportedAgentServerNotice error={config.error} />;
  }

  return <Outlet />;
}
