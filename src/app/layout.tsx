import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import { ProjectProvider } from "@/lib/project/ProjectProvider";
import { StorageBanner } from "@/components/StorageBanner";
import { NavBar } from "@/components/NavBar";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "TwinFlow Studio",
  description: "Local-first、AI-assisted 的数字孪生数据建模与质量治理工作台",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <ProjectProvider>
          <ToastProvider>
            <StorageBanner />
            <NavBar />
            {children}
          </ToastProvider>
        </ProjectProvider>
      </body>
    </html>
  );
}
