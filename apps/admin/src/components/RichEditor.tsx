"use client";

import { useRef, useState, useCallback } from "react";

const TOOLS = [
  { id: "bold", label: "B", cmd: "bold", title: "درشت" },
  { id: "italic", label: "I", cmd: "italic", title: "کج" },
  { id: "underline", label: "U", cmd: "underline", title: "زیرخط" },
  { id: "strikeThrough", label: "S", cmd: "strikeThrough", title: "خط‌خورده" },
  { id: "sep1", label: "|", cmd: "", title: "" },
  { id: "h2", label: "H2", cmd: "formatBlock", arg: "<h2>", title: "سرتیتر ۲" },
  { id: "h3", label: "H3", cmd: "formatBlock", arg: "<h3>", title: "سرتیتر ۳" },
  { id: "h4", label: "H4", cmd: "formatBlock", arg: "<h4>", title: "سرتیتر ۴" },
  { id: "p", label: "¶", cmd: "formatBlock", arg: "<p>", title: "پاراگراف" },
  { id: "sep2", label: "|", cmd: "", title: "" },
  { id: "ul", label: "•", cmd: "insertUnorderedList", title: "لیست" },
  { id: "ol", label: "1.", cmd: "insertOrderedList", title: "لیست شماره‌دار" },
  { id: "sep3", label: "|", cmd: "", title: "" },
  { id: "quote", label: "❝", cmd: "formatBlock", arg: "<blockquote>", title: "نقل قول" },
  { id: "code", label: "<>", cmd: "formatBlock", arg: "<pre>", title: "کد" },
  { id: "sep4", label: "|", cmd: "", title: "" },
  { id: "link", label: "🔗", cmd: "link", title: "لینک" },
  { id: "image", label: "🖼", cmd: "image", title: "تصویر" },
  { id: "sep5", label: "|", cmd: "", title: "" },
  { id: "alignRight", label: "☰→", cmd: "justifyRight", title: "راست‌چین" },
  { id: "alignCenter", label: "☰↔", cmd: "justifyCenter", title: "وسط‌چین" },
  { id: "alignLeft", label: "←☰", cmd: "justifyLeft", title: "چپ‌چین" },
  { id: "sep6", label: "|", cmd: "", title: "" },
  { id: "removeFormat", label: "✕", cmd: "removeFormat", title: "حذف قالب" },
  { id: "source", label: "{ }", cmd: "source", title: "نمایش HTML" },
];

/**
 * Safely execute a document.execCommand with a deprecation notice.
 * execCommand is deprecated but remains the only viable cross-browser
 * API for contentEditable formatting. A try-catch ensures no crashes
 * in environments where it is unsupported.
 */
function safeExecCommand(command: string, showDefaultUI = false, value?: string): boolean {
  try {
    const result = document.execCommand(command, showDefaultUI, value);
    if (!result) {
      console.warn(`[RichEditor] execCommand("${command}") returned false — the command may not be supported.`);
    }
    return result;
  } catch (err) {
    console.error(`[RichEditor] execCommand("${command}") threw:`, err);
    return false;
  }
}

type ModalType = "link" | "image" | null;

export default function RichEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showSource, setShowSource] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(value);
  const [modal, setModal] = useState<ModalType>(null);
  const [modalValue, setModalValue] = useState("");

  const exec = useCallback((tool: (typeof TOOLS)[0]) => {
    if (tool.cmd === "source") {
      if (showSource) {
        if (editorRef.current) editorRef.current.innerHTML = sourceHtml;
        onChange(sourceHtml);
      } else {
        if (editorRef.current) setSourceHtml(editorRef.current.innerHTML);
      }
      setShowSource(!showSource);
      return;
    }
    if (tool.cmd === "link") {
      setModal("link");
      setModalValue("");
      return;
    }
    if (tool.cmd === "image") {
      setModal("image");
      setModalValue("");
      return;
    }
    safeExecCommand(tool.cmd, false, (tool as Record<string, string>).arg ?? "");
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [showSource, sourceHtml, onChange]);

  const handleModalConfirm = useCallback(() => {
    if (!modal) return;
    const val = modalValue.trim();
    if (!val) {
      setModal(null);
      return;
    }
    if (modal === "link") {
      safeExecCommand("createLink", false, val);
    } else {
      safeExecCommand("insertImage", false, val);
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    setModal(null);
    setModalValue("");
  }, [modal, modalValue, onChange]);

  const handleModalCancel = useCallback(() => {
    setModal(null);
    setModalValue("");
  }, []);

  return (
    <div className="rounded-md border" style={{ borderColor: "var(--border)", position: "relative" }}>
      <div
        className="flex flex-wrap items-center gap-1 border-b p-2"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {TOOLS.map((tool) =>
          tool.label === "|" ? (
            <span key={tool.id} className="mx-1" style={{ color: "var(--border)" }}>|</span>
          ) : (
            <button
              key={tool.id}
              type="button"
              title={tool.title}
              onClick={() => exec(tool)}
              className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition hover:opacity-80"
              style={{
                background: showSource && tool.id === "source" ? "var(--accent)" : "transparent",
                color: showSource && tool.id === "source" ? "#fff" : "var(--text)",
              }}
            >
              {tool.label}
            </button>
          ),
        )}
      </div>
      {showSource ? (
        <textarea
          className="w-full rounded-b-md p-3 font-mono text-xs"
          style={{ background: "var(--bg)", color: "var(--text)", direction: "ltr", minHeight: "300px" }}
          value={sourceHtml}
          onChange={(e) => setSourceHtml(e.target.value)}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[300px] p-3 text-sm"
          style={{ background: "var(--bg)", color: "var(--text)", outline: "none" }}
          dangerouslySetInnerHTML={{ __html: value }}
          onInput={() => {
            if (editorRef.current) onChange(editorRef.current.innerHTML);
          }}
          data-placeholder={placeholder}
        />
      )}

      {/* Modal for link/image insertion */}
      {modal && (
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
          onClick={handleModalCancel}
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
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>
              {modal === "link" ? "درج لینک" : "درج تصویر"}
            </h3>
            <input
              type="text"
              value={modalValue}
              onChange={(e) => setModalValue(e.target.value)}
              placeholder={modal === "link" ? "https://..." : "https://... یا /images/..."}
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
                if (e.key === "Enter") handleModalConfirm();
                if (e.key === "Escape") handleModalCancel();
              }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleModalCancel}
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
                onClick={handleModalConfirm}
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
                {modal === "link" ? "درج لینک" : "درج تصویر"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
