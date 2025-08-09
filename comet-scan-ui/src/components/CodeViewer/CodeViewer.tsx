/* eslint-disable no-useless-escape */
import { FC, useMemo } from "react";
import styles from "./CodeViewer.module.scss";

type Props = {
  filePath: string;
  code: string;
};

function detectLanguage(filePath: string): "rust" | "json" | "toml" | "text" {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".rs")) return "rust";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".toml") || lower.endsWith(".lock")) return "toml";
  return "text";
}

const rustKeywords = new Set([
  "as","break","const","continue","crate","else","enum","extern","false","fn","for","if","impl","in","let","loop","match","mod","move","mut","pub","ref","return","self","Self","static","struct","super","trait","true","type","unsafe","use","where","while","dyn","async","await","abstract","become","box","do","final","macro","override","priv","typeof","unsized","virtual","yield","try",
]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightJson(source: string): string {
  // Basic JSON tokenization
  return escapeHtml(source)
    .replace(/(\{|\}|\[|\]|:|,)/g, '<span>$1</span>')
    .replace(/"([^"\\]|\\.)*"(?=\s*:)/g, '<span class="'+styles.key+'">$&</span>')
    .replace(/"([^"\\]|\\.)*"/g, '<span class="'+styles.string+'">$&</span>')
    .replace(/\b(true|false)\b/g, '<span class="'+styles.boolean+'">$1</span>')
    .replace(/\bnull\b/g, '<span class="'+styles.null+'">$&</span>')
    .replace(/(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g, '<span class="'+styles.number+'">$1</span>');
}

function highlightToml(source: string): string {
  let out = escapeHtml(source);
  // Sections [package]
  out = out.replace(/^\s*\[(.+?)\]\s*$/gm, '<span class="'+styles.section+'">[$1]</span>');
  // Keys key =
  out = out.replace(/(^|\s)([A-Za-z0-9_\-\.]+)(\s*=)/g, `$1<span class="${styles.key}">$2</span>$3`);
  // Strings
  out = out.replace(/"([^"\\]|\\.)*"/g, '<span class="'+styles.string+'">$&</span>');
  out = out.replace(/'([^'\\]|\\.)*'/g, '<span class="'+styles.string+'">$&</span>');
  // Booleans, numbers
  out = out.replace(/\b(true|false)\b/g, '<span class="'+styles.boolean+'">$1</span>');
  out = out.replace(/(-?\b\d+(?:\.\d+)?\b)/g, '<span class="'+styles.number+'">$1</span>');
  // Comments
  out = out.replace(/(^|\s)#([^\n]*)/g, `$1<span class="${styles.comment}">#$2</span>`);
  return out;
}

function highlightRust(source: string): string {
  // Escape HTML first
  let out = escapeHtml(source);

  // Collect placeholders for comments and strings so later replacements don't touch tag markup
  const commentPlaceholders: string[] = [];
  const stringPlaceholders: string[] = [];

  // Extract block comments
  out = out.replace(/\/\*[\s\S]*?\*\//g, (m) => {
    const idx = commentPlaceholders.push(m) - 1;
    return `__COMM__${idx}__`;
  });
  // Extract line comments
  out = out.replace(/\/\/[^\n]*/g, (m) => {
    const idx = commentPlaceholders.push(m) - 1;
    return `__COMM__${idx}__`;
  });

  // Extract strings and chars
  out = out.replace(/b?\"([^\"\\]|\\.)*\"/g, (m) => {
    const idx = stringPlaceholders.push(m) - 1;
    return `__STR__${idx}__`;
  });
  out = out.replace(/'.'/g, (m) => {
    const idx = stringPlaceholders.push(m) - 1;
    return `__STR__${idx}__`;
  });

  // Highlight macros and keywords on code-only segment
  out = out.replace(/\b([A-Za-z_][A-Za-z0-9_]*)!/g, `<span class="${styles.macro}">$1</span>!`);
  out = out.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g, (word) => {
    return rustKeywords.has(word) ? `<span class="${styles.keyword}">${word}</span>` : word;
  });

  // Restore strings
  out = out.replace(/__STR__([0-9]+)__/g, (_m, g1) => {
    const original = stringPlaceholders[parseInt(g1, 10)] || '';
    return `<span class="${styles.string}">${original}</span>`;
  });
  // Restore comments
  out = out.replace(/__COMM__([0-9]+)__/g, (_m, g1) => {
    const original = commentPlaceholders[parseInt(g1, 10)] || '';
    return `<span class="${styles.comment}">${original}</span>`;
  });

  return out;
}

const CodeViewer: FC<Props> = ({ filePath, code }) => {
  const lang = useMemo(() => detectLanguage(filePath), [filePath]);
  const html = useMemo(() => {
    try {
      if (lang === "json") return highlightJson(code);
      if (lang === "toml") return highlightToml(code);
      if (lang === "rust") return highlightRust(code);
      return escapeHtml(code);
    } catch {
      return escapeHtml(code);
    }
  }, [code, lang]);

  return (
    <div className={styles.container}>
      <pre className={styles.codeBlock} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export default CodeViewer;


