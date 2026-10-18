"use client";
import { memo } from "react";
import { m, useReducedMotion } from "framer-motion";
export const Reveal = memo(function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={reduce ? false : { opacity: 1, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
});
