// import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
// import { Appearance } from "react-native";
// import { colorScheme } from "nativewind";

// type Theme = "light" | "dark";

// interface ThemeContextType {
//   theme: Theme;
//   toggleTheme: () => void;
//   setTheme: (theme: Theme) => void;
// }

// const ThemeContext = createContext<ThemeContextType>({
//   theme: "light",
//   toggleTheme: () => {},
//   setTheme: () => {},
// });

// interface ThemeProviderProps {
//   children: ReactNode;
// }

// export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
//   const systemTheme = Appearance.getColorScheme() as Theme | null;
//   const [theme, setThemeState] = useState<Theme>(systemTheme || "light");

//   useEffect(() => {
//     colorScheme.set(theme); // Apply theme globally for NativeWind
//   }, [theme]);

//   const toggleTheme = () => {
//     setThemeState(prev => (prev === "light" ? "dark" : "light"));
//   };

//   const setTheme = (newTheme: Theme) => {
//     setThemeState(newTheme);
//   };

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

// // Hook to use theme
// export const useTheme = (): ThemeContextType => useContext(ThemeContext);




import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Appearance } from "react-native";
import { colorScheme } from "nativewind";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemTheme = Appearance.getColorScheme() as Theme | null;
  const [theme, setThemeState] = useState<Theme>(systemTheme || "light");

  useEffect(() => {
    colorScheme.set(theme); // Update NativeWind theme globally
  }, [theme]);

  const toggleTheme = () => setThemeState(prev => (prev === "light" ? "dark" : "light"));
  const setTheme = (newTheme: Theme) => setThemeState(newTheme);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => useContext(ThemeContext);
