'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';

export function DashboardPageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="flex-1"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
}
