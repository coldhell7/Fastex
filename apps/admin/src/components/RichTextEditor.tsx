"use client";

import { useCallback, useRef, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: number;
}

type ToolItem = { cmd: string; label: string; title: string; value?: string } | { sep: true };

const TOOLS: ToolItem[] = [
  { cmd: "bold", label: "B", title: "درشت" },
  { cmd: "italic", label: "I", title: "کج" },
  { cmd: "underline", label: "U", title: "زیرخط" },
  { cmd: "strikeThrough", label: "S", title: "خط‌خورده" },
  { sep: true },
  { cmd: "insertUnorderedList", label: "•", title: "لیست" },
  { cmd: "insertOrderedList", label: "1.", title: "لیست شماره‌دار" },
  { sep: true },
  { cmd: "justifyRight", label: "⫞", title: "راست‌چین" },
  { cmd: "justifyCenter", label: "⫿", title: "وسط‌چین" },
  { cmd: "justifyLeft", label: "⫟", title: "چپ‌چین" },
  { sep: true },
  { cmd: "createLink", label: "🔗", title: "لینک" },
  { cmd: "removeFormat", label: "✕", title: "پاک‌سازی فرمت" },
  { sep: true },
  { cmd: "formatBlock", value: "h2", label: "H2", title: "سرتیتر ۲" },
  { cmd: "formatBlock", value: "h3", label: "H3", title: "سرتیتر ۳" },
  { cmd: "formatBlock", value: "p", label: "P", title: "پاراگراف" },
  { sep: true },
  { cmd: "insertHorizontalRule", label: "—", title: "خط جدا" },
];

/**
 * Safely execute document.execCommand with deprecation notice.
 * execCommand is deprecated but remains the only viable cross-browser
 * API for contentEditable formatting. A try-catch prevents crashes.
 */
function safeExecCommand(command: string, showDefaultUI = false, value?: string): boolean {
  try {
    const result = document.execCommand(command, showDefaultUI, value);
    if (!result) {
      console.warn(`[RichTextEditor] execCommand("${command}") returned false — may not be supported.`);
    }
    return result;
  } catch (err) {
    console.error(`[RichTextEditor] execCommand("${command}") threw:`, err);
    return false;
  }
}

export default function RichTextEditor({ value, onChange, placeholder, height = 300 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const exec = useCallback((cmd: string, val?: string) => {
    if (cmd === "createLink") {
      setLinkModalOpen(true);
      setLinkUrl("");
      return;
    }
    if (cmd === "formatBlock") {
      safeExecCommand(cmd, false, `<${val}>`);
    } else {
      safeExecCommand(cmd, false, val);
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleLinkConfirm = useCallback(() => {
    const url = linkUrl.trim();
    if (url) {
      safeExecCommand("createLink", false, url);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }
    setLinkModalOpen(false);
    setLinkUrl("");
  }, [linkUrl, onChange]);

  const handleLinkCancel = useCallback(() => {
    setLinkModalOpen(false);
    setLinkUrl("");
  }, []);

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="rounded-md border" style={{ borderColor: "var(--border)", position: "relative" }}>
      <div
        className="flex flex-wrap items-center gap-1 border-b p-2"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {TOOLS.map((tool, i) =>
          "sep" in tool ? (
            <span key={i} className="mx-1" style={{ color: "var(--border)" }}>│</span>
          ) : (
            <button
              key={i}
              type="button"
              title={tool.title}
              onMouseDown={(e) => { e.preventDefault(); exec(tool.cmd, tool.value ?? ""); }}
              className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition hover:opacity-80"
              style={{ color: "var(--text)", background: "transparent" }}
            >
              {tool.label}
            </button>
          ),
        )}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        dangerouslySetInnerHTML={{ __html: value }}
        className="p-4 text-sm"
        style={{
          minHeight: height,
          outline: "none",
          background: "var(--bg-elevated)",
          color: "var(--text)",
          direction: "rtl",
          lineHeight: "1.8",
        }}
        data-placeholder={placeholder}
      />
      {!focused && !value && placeholder && (
        <div
          className="pointer-events-none absolute px-4 py-3 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          {placeholder}
        </div>
      )}

      {/* Link insertion modal */}
      {linkModalOpen && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            borderRadius: "inherit",
          }}
          onClick={handleLinkCancel}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "20px",
              minWidth: "320px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>درج لینک</h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "13px",
                direction: "ltr",
                boxSizing: "border-box",
                marginBottom: "12px",
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLinkConfirm();
                if (e.key === "Escape") handleLinkCancel();
              }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleLinkCancel}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleLinkConfirm}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                درج لینک
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
