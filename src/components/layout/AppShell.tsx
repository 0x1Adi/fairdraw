import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Toaster } from "sonner";

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-navy">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "bg-surface border-border text-foreground",
            title: "text-foreground",
            description: "text-muted-foreground",
          },
        }}
      />
    </div>
  );
}
