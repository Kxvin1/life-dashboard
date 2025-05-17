// This script is used to prevent the flash of incorrect theme
// It's a clean implementation that follows Next.js best practices

export function getThemeScript(): string {
  return `
    (function() {
      try {
        let isDarkMode = false;

        // Check if we have a stored theme preference
        const storedTheme = localStorage.getItem('theme');

        // If we have a stored preference, use it
        if (storedTheme === 'dark') {
          isDarkMode = true;
        } else if (storedTheme === 'light') {
          isDarkMode = false;
        } else {
          // If no stored preference, default to dark mode
          isDarkMode = true;
          localStorage.setItem('theme', 'dark');
        }

        // Apply the theme to the document
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        // If there's an error (e.g., localStorage blocked), default to dark
        document.documentElement.classList.add('dark');
      }
    })();
  `;
}
