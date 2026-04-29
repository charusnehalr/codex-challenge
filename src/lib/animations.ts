export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35 } },
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export const cardHover = {
  rest: { scale: 1, boxShadow: "0 1px 3px rgba(31,27,22,0.06)" },
  hover: {
    scale: 1.012,
    boxShadow: "0 8px 32px rgba(31,27,22,0.10)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

export const buttonTap = { scale: 0.96 };

export const slideInLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};
