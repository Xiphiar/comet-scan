export function setTheme(themeClassName: string) {
  localStorage.setItem('theme', themeClassName);
  document.documentElement.className = themeClassName;
}