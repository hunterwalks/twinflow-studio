import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import { ProjectProvider } from "@/lib/project/ProjectProvider";
import { StorageBanner } from "@/components/StorageBanner";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "TwinFlow Studio",
  description: "Local-first、AI-assisted 的数字孪生数据建模与质量治理工作台",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <ProjectProvider>
          <StorageBanner />
          <NavBar />
          {children}
        </ProjectProvider>
      </body>
    </html>
  );
}
