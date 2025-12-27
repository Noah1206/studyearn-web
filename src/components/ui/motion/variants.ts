/**
 * Framer Motion Variants
 * 토스 스타일 애니메이션 프리셋
 */

import type { Variants, Transition } from 'framer-motion';

// ============================================
// Transition Presets
// ============================================
export const transitions = {
  // Toss-style smooth transitions
  toss: {
    type: 'tween',
    ease: [0.33, 1, 0.68, 1],
    duration: 0.3,
  } as Transition,

  tossIn: {
    type: 'tween',
    ease: [0.32, 0, 0.67, 0],
    duration: 0.3,
  } as Transition,

  tossOut: {
    type: 'tween',
    ease: [0.33, 1, 0.68, 1],
    duration: 0.2,
  } as Transition,

  // Spring transitions
  spring: {
    type: 'spring',
    stiffness: 260,
    damping: 20,
  } as Transition,

  springGentle: {
    type: 'spring',
    stiffness: 120,
    damping: 14,
  } as Transition,

  springSnappy: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  } as Transition,

  springBouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 10,
  } as Transition,

  // Fast for micro-interactions
  fast: {
    type: 'tween',
    duration: 0.15,
    ease: 'easeOut',
  } as Transition,
};

// ============================================
// Page Transitions
// ============================================
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.33, 1, 0.68, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

// ============================================
// Modal Variants
// ============================================
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

// ============================================
// Bottom Sheet Variants
// ============================================
export const bottomSheetVariants: Variants = {
  hidden: {
    y: '100%',
  },
  visible: {
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: '100%',
    transition: {
      duration: 0.2,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

// ============================================
// Card Variants
// ============================================
export const cardVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
};

export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.01,
    y: -2,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

// ============================================
// Button Variants
// ============================================
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.97,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
};

// ============================================
// List & Stagger Variants
// ============================================
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

// ============================================
// Fade Variants
// ============================================
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.33, 1, 0.68, 1],
    },
  },
};

export const fadeDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.33, 1, 0.68, 1],
    },
  },
};

export const fadeScaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

// ============================================
// Slide Variants
// ============================================
export const slideLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2,
    },
  },
};

export const slideRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
    },
  },
};

// ============================================
// Toast Variants
// ============================================
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

// ============================================
// Dropdown Variants
// ============================================
export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -5,
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// ============================================
// Tabs Variants
// ============================================
export const tabIndicatorVariants = {
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  },
};

export const tabContentVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 10,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.15,
    },
  },
};

// ============================================
// Skeleton Variants
// ============================================
export const skeletonVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ============================================
// Scroll-based Variants
// ============================================
export const scrollFadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.33, 1, 0.68, 1],
    },
  },
};

// ============================================
// Utility function for stagger children
// ============================================
export const createStaggerContainer = (
  staggerChildren = 0.05,
  delayChildren = 0
): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const createStaggerItem = (
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance = 20
): Variants => {
  const axis = direction === 'up' || direction === 'down' ? 'y' : 'x';
  const sign = direction === 'up' || direction === 'left' ? 1 : -1;

  const hidden = {
    opacity: 0,
    ...(axis === 'y' ? { y: distance * sign } : { x: distance * sign }),
  };

  const visible = {
    opacity: 1,
    ...(axis === 'y' ? { y: 0 } : { x: 0 }),
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  };

  return { hidden, visible };
};
