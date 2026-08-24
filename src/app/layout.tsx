import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import { ProjectProvider } from "@/lib/project/ProjectProvider";
import { StorageBanner } from "@/components/StorageBanner";
import { Sidebar, MobileNav } from "@/components/ui/Sidebar";
import { TopBar } from "@/components/ui/TopBar";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "TwinFlow Studio",
  description: "Local-first、AI-assisted 的数字孪生数据建模与质量治理工作台",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-page text-ink-1">
        <ProjectProvider>
          <ToastProvider>
            <StorageBanner />
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <MobileNav />
                <TopBar />
                <main className="flex-1">{children}</main>
              </div>
            </div>
          </ToastProvider>
        </ProjectProvider>
      </body>
    </html>
  );
}
