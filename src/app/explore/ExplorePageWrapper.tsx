'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';

export function ExplorePageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
}
