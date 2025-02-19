import { writable } from 'svelte/store';

// Initialize dark mode from localStorage or system preference
const getInitialDarkMode = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return stored === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

export const darkMode = writable(getInitialDarkMode());

export function toggleTheme() {
  darkMode.update(current => {
    const newValue = !current;
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', newValue);
      document.documentElement.classList.toggle('dark', newValue);
    }
    return newValue;
  });
} 