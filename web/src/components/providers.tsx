"use client";
import { DataBootstrap } from "./data-bootstrap";
import { MotionConfig, LazyMotion } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
const loadMotion = () =>
  import("./motion/features").then((module) => module.default);
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotion} strict>
        <TooltipProvider delayDuration={250}>
          <DataBootstrap />
          {children}
          <Toaster />
        </TooltipProvider>
      </LazyMotion>
    </MotionConfig>
  );
}
