// Comprehensive Color Scheme for Sudoku App
// Based on analysis of all components and pages

export const Colors = {
  // Primary Brand Colors
  primary: {
    main: '#e94560', // Main brand color (pink/red)
    light: '#ff6b6b', // Lighter variant for accents
    dark: '#c04967', // Darker variant for pressed states
  },

  // Background Gradients
  background: {
    primary: '#1a1a2e', // Dark blue - main background
    secondary: '#16213e', // Medium blue - gradient middle
    tertiary: '#0f3460', // Light blue - gradient end
    splash: '#0B1A2E', // Splash screen background
    android: '#0C1B30', // Android specific background
  },

  // Surface Colors (Cards, Modals, Buttons)
  surface: {
    primary: 'rgba(255, 255, 255, 0.1)', // Main surface color
    secondary: 'rgba(255, 255, 255, 0.05)', // Secondary surface
    tertiary: 'rgba(255, 255, 255, 0.08)', // Tertiary surface
    modal: 'rgba(26, 26, 46, 0.98)', // Modal background
    overlay: 'rgba(0, 0, 0, 0.85)', // Modal overlay
  },

  // Border Colors
  border: {
    primary: 'rgba(255, 255, 255, 0.2)', // Main border color
    secondary: 'rgba(255, 255, 255, 0.3)', // Secondary border
    tertiary: 'rgba(255, 255, 255, 0.15)', // Tertiary border
    cell: 'rgba(0, 0, 0, 0.57)', // Sudoku cell borders
    grid: 'rgba(255, 255, 255, 0.2)', // Grid borders
  },

  // Text Colors
  text: {
    primary: '#ffffff', // Main text color
    secondary: 'rgba(255, 255, 255, 0.8)', // Secondary text
    tertiary: 'rgba(255, 255, 255, 0.7)', // Tertiary text
    muted: 'rgba(255, 255, 255, 0.6)', // Muted text
    disabled: 'rgba(255, 255, 255, 0.5)', // Disabled text
    notes: 'rgba(210, 210, 210, 0.50)', // Notes text
  },

  // Sudoku Grid Colors
  grid: {
    background: 'rgba(255, 255, 255, 0.1)', // Grid background
    cell: 'rgba(255, 255, 255, 0.05)', // Cell background
    selected: 'rgba(110, 53, 62, 0.58)', // Selected cell
    highlighted: 'rgba(183, 50, 72, 0.11)', // Highlighted cells
    original: 'rgba(187, 149, 234, 0.05)', // Original numbers
    sameValue: 'rgba(207, 30, 60, 0.13)', // Same value cells
  },

  // Number Colors (Sudoku Grid)
  numbers: {
    original: 'rgb(69, 129, 233)', // Original numbers (blue)
    correct: 'rgba(76, 175, 80, 1)', // Correct numbers (green)
    incorrect: 'rgba(244, 67, 54, 1)', // Incorrect numbers (red)
    selected: 'rgba(255, 255, 255, 1)', // Selected cell text
    notes: {
      visible: 'rgba(200, 200, 200, 0.6)', // Visible notes
      hidden: 'transparent', // Hidden notes
    },
  },

  // Status Colors
  status: {
    success: '#4CAF50', // Success/Completed (green)
    error: '#f44336', // Error/Mistakes (red)
    warning: '#ff9800', // Warning (orange)
    info: '#2196F3', // Info (blue)
  },

  // Button Colors
  button: {
    primary: {
      background: '#e94560', // Primary button background
      text: '#ffffff', // Primary button text
      shadow: '#e94560', // Primary button shadow
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.1)', // Secondary button background
      text: '#ffffff', // Secondary button text
      border: 'rgba(255, 255, 255, 0.2)', // Secondary button border
    },
    disabled: {
      background: 'rgba(255, 255, 255, 0.08)', // Disabled button background
      text: 'rgba(255, 255, 255, 0.5)', // Disabled button text
      border: 'rgba(255, 255, 255, 0.15)', // Disabled button border
    },
  },

  // Switch Colors
  switch: {
    track: {
      false: 'rgba(255, 255, 255, 0.6)', // Switch track off
      true: 'rgba(135, 49, 63, 0.5)', // Switch track on
    },
    thumb: {
      false: 'rgba(255, 255, 255, 0.73)', // Switch thumb off
      true: 'rgba(192, 73, 103, 0.87)', // Switch thumb on
    },
  },

  // Icon Colors
  icon: {
    primary: '#ffffff', // Primary icon color
    secondary: 'rgba(255, 255, 255, 0.7)', // Secondary icon color
    accent: '#ff6b6b', // Accent icon color
    error: '#ff6b6b', // Error icon color
  },

  // Shadow Colors
  shadow: {
    primary: '#000000', // Primary shadow
    button: '#e94560', // Button shadow
  },

  // Transparent Colors
  transparent: {
    white: {
      5: 'rgba(255, 255, 255, 0.05)',
      8: 'rgba(255, 255, 255, 0.08)',
      10: 'rgba(255, 255, 255, 0.1)',
      12: 'rgba(255, 255, 255, 0.12)',
      15: 'rgba(255, 255, 255, 0.15)',
      20: 'rgba(255, 255, 255, 0.2)',
      30: 'rgba(255, 255, 255, 0.3)',
      50: 'rgba(255, 255, 255, 0.5)',
      60: 'rgba(255, 255, 255, 0.6)',
      70: 'rgba(255, 255, 255, 0.7)',
      80: 'rgba(255, 255, 255, 0.8)',
      85: 'rgba(255, 255, 255, 0.85)',
      98: 'rgba(255, 255, 255, 0.98)',
    },
    black: {
      57: 'rgba(0, 0, 0, 0.57)',
      85: 'rgba(0, 0, 0, 0.85)',
    },
  },
} as const;

// Type for accessing colors
export type ColorScheme = typeof Colors;

// Helper function to get colors with fallback
export const getColor = (path: string, fallback: string = '#ffffff'): string => {
  const keys = path.split('.');
  let current: any = Colors;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return fallback;
    }
  }
  
  return typeof current === 'string' ? current : fallback;
};

// Semantic color helpers
export const SemanticColors = {
  // Backgrounds
  getBackground: () => Colors.background.primary,
  getSurface: () => Colors.surface.primary,
  getModalBackground: () => Colors.surface.modal,
  
  // Text
  getTextPrimary: () => Colors.text.primary,
  getTextSecondary: () => Colors.text.secondary,
  getTextMuted: () => Colors.text.muted,
  
  // Buttons
  getButtonPrimary: () => Colors.button.primary.background,
  getButtonSecondary: () => Colors.button.secondary.background,
  getButtonDisabled: () => Colors.button.disabled.background,
  
  // Status
  getSuccess: () => Colors.status.success,
  getError: () => Colors.status.error,
  getWarning: () => Colors.status.warning,
  
  // Grid
  getGridBackground: () => Colors.grid.background,
  getCellBackground: () => Colors.grid.cell,
  getSelectedCell: () => Colors.grid.selected,
  getHighlightedCell: () => Colors.grid.highlighted,
  
  // Numbers
  getOriginalNumber: () => Colors.numbers.original,
  getCorrectNumber: () => Colors.numbers.correct,
  getIncorrectNumber: () => Colors.numbers.incorrect,
} as const; 