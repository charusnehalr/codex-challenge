import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ErrorBoundary, ToastContainer } from "@/components/ui";

export default function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <ErrorBoundary>
        <div className="flex h-screen overflow-hidden bg-paper">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileHeader />
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-[1320px] px-4 py-6 md:px-6 md:py-8">{children}</div>
            </main>
          </div>
          <ToastContainer />
        </div>
      </ErrorBoundary>
    </QueryProvider>
  );
}
