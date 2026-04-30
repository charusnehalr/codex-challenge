import { AuthModal } from "@/components/features/auth/AuthModal";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { CustomCursor, ErrorBoundary, PageTransition, ToastContainer } from "@/components/ui";

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
            <main className="min-w-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[1320px] min-w-0 px-4 py-8 xl:px-6">
                <PageTransition>{children}</PageTransition>
              </div>
            </main>
          </div>
          <CustomCursor />
          <AuthModal />
          <ToastContainer />
        </div>
      </ErrorBoundary>
    </QueryProvider>
  );
}
