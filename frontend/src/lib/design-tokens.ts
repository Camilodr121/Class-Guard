// frontend/src/lib/design-tokens.ts
// Sistema de diseño unificado para Class Guard

/**
 * PALETA DE COLORES
 * Basada en principios de accesibilidad y jerarquía visual
 */
export const colors = {
  // Primarios - Identidad de marca
  primary: {
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    gradientHover: 'from-blue-600 via-indigo-600 to-purple-700',
    solid: 'blue-600',
    light: 'blue-50',
    border: 'blue-200',
  },
  
  // Niveles de atención - Sistema semafórico consistente
  attention: {
    high: {
      gradient: 'from-emerald-400 via-green-500 to-emerald-600',
      solid: 'emerald-500',
      light: 'emerald-50',
      text: 'emerald-700',
      border: 'emerald-200',
      glow: 'shadow-emerald-500/20',
    },
    medium: {
      gradient: 'from-amber-400 via-orange-500 to-amber-600',
      solid: 'amber-500',
      light: 'amber-50',
      text: 'amber-700',
      border: 'amber-200',
      glow: 'shadow-amber-500/20',
    },
    low: {
      gradient: 'from-red-400 via-rose-500 to-red-600',
      solid: 'red-500',
      light: 'red-50',
      text: 'red-700',
      border: 'red-200',
      glow: 'shadow-red-500/20',
    },
  },

  // Métricas específicas - Colores únicos para cada métrica
  metrics: {
    blinks: {
      gradient: 'from-blue-400 via-cyan-500 to-blue-600',
      solid: 'cyan-500',
      light: 'blue-50',
      text: 'blue-600',
      iconBg: 'bg-blue-100',
      border: 'border-blue-200',
      glow: 'shadow-blue-500/20',
    },
    yawns: {
      gradient: 'from-orange-400 via-amber-500 to-orange-600',
      solid: 'orange-500',
      light: 'orange-50',
      text: 'orange-600',
      iconBg: 'bg-orange-100',
      border: 'border-orange-200',
      glow: 'shadow-orange-500/20',
    },
    time: {
      gradient: 'from-purple-400 via-violet-500 to-purple-600',
      solid: 'purple-500',
      light: 'purple-50',
      text: 'purple-600',
      iconBg: 'bg-purple-100',
      border: 'border-purple-200',
      glow: 'shadow-purple-500/20',
    },
    energy: {
      gradient: 'from-yellow-400 via-amber-400 to-yellow-500',
      solid: 'yellow-500',
      light: 'yellow-50',
      text: 'yellow-600',
      iconBg: 'bg-yellow-100',
      border: 'border-yellow-200',
      glow: 'shadow-yellow-500/20',
    },
  },

  // Neutrales - Backgrounds, texto, bordes
  neutral: {
    bg: {
      primary: 'bg-white',
      secondary: 'bg-gray-50',
      tertiary: 'bg-gray-100',
      dark: 'bg-gray-900',
    },
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      tertiary: 'text-gray-400',
      inverse: 'text-white',
    },
    border: {
      light: 'border-gray-200',
      medium: 'border-gray-300',
      dark: 'border-gray-400',
    },
  },

  // Estados - Success, warning, error, info
  status: {
    success: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      solid: 'bg-green-500',
    },
    warning: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      solid: 'bg-yellow-500',
    },
    error: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      solid: 'bg-red-500',
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      solid: 'bg-blue-500',
    },
  },
};

/**
 * ESPACIADO Y DIMENSIONES
 * Sistema de 8px base para consistencia
 */
export const spacing = {
  card: {
    padding: 'p-6',
    paddingSm: 'p-4',
    paddingLg: 'p-8',
    gap: 'gap-6',
    gapSm: 'gap-4',
  },
  section: {
    marginBottom: 'mb-8',
    gap: 'gap-8',
  },
  grid: {
    cols: {
      default: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      two: 'grid-cols-1 md:grid-cols-2',
      four: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    },
    gap: 'gap-6',
  },
};

/**
 * TIPOGRAFÍA
 * Escala modular para jerarquía clara
 */
export const typography = {
  title: {
    h1: 'text-3xl md:text-4xl font-bold',
    h2: 'text-2xl md:text-3xl font-bold',
    h3: 'text-xl md:text-2xl font-semibold',
    h4: 'text-lg md:text-xl font-semibold',
  },
  body: {
    large: 'text-lg',
    normal: 'text-base',
    small: 'text-sm',
    tiny: 'text-xs',
  },
  weight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
};

/**
 * SOMBRAS Y EFECTOS
 * Elevación consistente para jerarquía visual
 */
export const effects = {
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    inner: 'shadow-inner',
    none: 'shadow-none',
  },
  glow: {
    sm: 'shadow-lg',
    md: 'shadow-xl',
    lg: 'shadow-2xl',
  },
  blur: {
    backdrop: 'backdrop-blur-sm',
    backdropMd: 'backdrop-blur-md',
  },
  transition: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-300',
    slow: 'transition-all duration-500',
  },
  hover: {
    scale: 'hover:scale-[1.02]',
    scaleSm: 'hover:scale-[1.01]',
    lift: 'hover:-translate-y-1',
    shadow: 'hover:shadow-xl',
  },
};

/**
 * BORDES Y RADIUS
 */
export const borders = {
  radius: {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  },
  width: {
    thin: 'border',
    medium: 'border-2',
    thick: 'border-4',
  },
};

/**
 * COMPONENTES COMPUESTOS
 * Combinaciones pre-definidas para componentes comunes
 */
export const components = {
  card: {
    base: `${borders.radius.lg} ${colors.neutral.bg.primary} ${borders.width.thin} ${colors.neutral.border.light} ${effects.shadow.md} ${effects.transition.normal}`,
    hover: `${effects.hover.shadow} ${effects.hover.lift}`,
    interactive: `${borders.radius.lg} ${colors.neutral.bg.primary} ${borders.width.thin} ${colors.neutral.border.light} ${effects.shadow.md} ${effects.transition.normal} ${effects.hover.shadow} ${effects.hover.lift} cursor-pointer`,
  },
  
  statCard: {
    base: `${spacing.card.padding} ${borders.radius.lg} ${borders.width.thin} ${effects.transition.normal}`,
    withGradient: (gradientColor: string) => 
      `bg-gradient-to-br ${gradientColor} ${borders.radius.lg} ${borders.width.thin} ${effects.shadow.lg} ${effects.transition.normal}`,
  },

  badge: {
    base: `inline-flex items-center px-3 py-1 ${borders.radius.full} ${typography.body.small} ${typography.weight.medium}`,
    success: `${colors.status.success.bg} ${colors.status.success.text} ${colors.status.success.border} ${borders.width.thin}`,
    warning: `${colors.status.warning.bg} ${colors.status.warning.text} ${colors.status.warning.border} ${borders.width.thin}`,
    error: `${colors.status.error.bg} ${colors.status.error.text} ${colors.status.error.border} ${borders.width.thin}`,
    info: `${colors.status.info.bg} ${colors.status.info.text} ${colors.status.info.border} ${borders.width.thin}`,
  },

  button: {
    primary: `bg-gradient-to-r ${colors.primary.gradient} text-white ${effects.shadow.lg} ${effects.hover.shadow}`,
    secondary: `${colors.neutral.bg.tertiary} ${colors.neutral.text.primary}`,
  },
};

/**
 * HELPERS - Funciones utilitarias
 */
export const helpers = {
  // Obtener color según nivel de atención
  getAttentionColor: (score: number) => {
    if (score >= 70) return colors.attention.high;
    if (score >= 40) return colors.attention.medium;
    return colors.attention.low;
  },

  // Obtener nivel de energía
  getEnergyLevel: (score: number) => {
    if (score >= 80) return { label: 'Excelente', color: colors.attention.high };
    if (score >= 60) return { label: 'Bueno', color: colors.attention.medium };
    if (score >= 40) return { label: 'Regular', color: colors.status.warning };
    return { label: 'Bajo', color: colors.attention.low };
  },

  // Combinar clases
  cn: (...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(' ');
  },
};

/**
 * BREAKPOINTS - Para uso en componentes
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
