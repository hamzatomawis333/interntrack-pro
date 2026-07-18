import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "OJT Attendance Tracking System" },
      {
        name: "description",
        content:
          "Modern OJT attendance tracker for interns and administrators — time in, time out, monitoring, and reports.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <div className="text-7xl font-semibold text-primary">404</div>
        <p className="mt-2 text-muted-foreground">This page doesn't exist.</p>
        <a
          href="/"
          className="mt-6 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go home
        </a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `if(localStorage.getItem('theme_dark')==='true')document.documentElement.classList.add('dark');`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
