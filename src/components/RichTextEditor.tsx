"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Link,
  Link2Off,
  Highlighter,
  List,
  ListOrdered,
  Minus,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "What's the plan?",
  minHeight = 120,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const savedSelectionRef = useRef<Range | null>(null);
  const isInternalUpdate = useRef(false);

  // Sync external value → DOM (only on mount)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      isInternalUpdate.current = true;
      el.innerHTML = value;
      isInternalUpdate.current = false;
    }
  }, []);

  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    if (document.queryCommandState("insertUnorderedList")) formats.add("ul");
    if (document.queryCommandState("insertOrderedList")) formats.add("ol");

    // Check if cursor is inside <mark> or <a>
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).startContainer;
      while (node && node !== editorRef.current) {
        const tag = (node as Element).tagName;
        if (tag === "MARK") {
          formats.add("highlight");
          break;
        }
        if (tag === "A") {
          formats.add("link");
          break;
        }
        node = node.parentNode;
      }
    }
    setActiveFormats(formats);
  }, []);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  }, []);

  const exec = useCallback(
    (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      onChange(editorRef.current?.innerHTML || "");
      updateActiveFormats();
    },
    [onChange, updateActiveFormats],
  );

  // ── Highlight: wrap/unwrap in <mark> ──
  const toggleHighlight = useCallback(() => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    // Check if already inside a <mark>
    let node: Node | null = sel.getRangeAt(0).startContainer;
    let existingMark: Element | null = null;
    while (node && node !== editorRef.current) {
      if ((node as Element).tagName === "MARK") {
        existingMark = node as Element;
        break;
      }
      node = node.parentNode;
    }

    if (existingMark) {
      // Unwrap
      const parent = existingMark.parentNode!;
      while (existingMark.firstChild) {
        parent.insertBefore(existingMark.firstChild, existingMark);
      }
      parent.removeChild(existingMark);
    } else {
      const range = sel.getRangeAt(0);
      if (range.collapsed) return;
      const mark = document.createElement("mark");
      try {
        range.surroundContents(mark);
      } catch {
        const fragment = range.extractContents();
        mark.appendChild(fragment);
        range.insertNode(mark);
      }
    }

    onChange(editorRef.current?.innerHTML || "");
    updateActiveFormats();
  }, [onChange, updateActiveFormats]);

  // ── Insert horizontal divider ──
  const insertDivider = useCallback(() => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, "<hr><br>");
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (!isInternalUpdate.current) {
      onChange(editorRef.current?.innerHTML || "");
    }
    updateActiveFormats();
  }, [onChange, updateActiveFormats]);

  const handleLinkInsert = useCallback(() => {
    restoreSelection();
    let url = linkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    exec("createLink", url);
    setTimeout(() => {
      editorRef.current?.querySelectorAll("a").forEach((a) => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      });
    }, 0);
    setShowLinkInput(false);
    setLinkUrl("");
  }, [linkUrl, exec, restoreSelection]);

  const openLinkInput = useCallback(() => {
    saveSelection();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).startContainer;
      while (node && node !== editorRef.current) {
        if ((node as Element).tagName === "A") {
          setLinkUrl((node as HTMLAnchorElement).href);
          break;
        }
        node = node.parentNode;
      }
    }
    setShowLinkInput(true);
  }, [saveSelection]);

  return (
    <div className="rte-wrap">
      <style>{`
        .rte-wrap {
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid #e2d9ce;
          background: #efe7da;
          transition: border-color 0.15s;
        }
        .rte-wrap:focus-within {
          border-color: #c2602a;
          background: #faf5ee;
        }

        /* Toolbar */
        .rte-toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 8px 10px;
          border-bottom: 1px solid #ddd3c5;
          background: #e8ddd0;
          flex-wrap: wrap;
        }
        .rte-btn {
          width: 30px; height: 30px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #7a6a60;
          display: grid; place-items: center;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
          flex-shrink: 0;
          position: relative;
        }
        .rte-btn:hover { background: #d9cfc3; color: #3a2e2a; }
        .rte-btn.rte-active { background: #5a3825; color: white; }
        .rte-btn.rte-active-hl { background: #fef08a; color: #78350f; }

        /* Tooltip */
        .rte-btn::after {
          content: attr(data-tip);
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          background: #1a1410;
          color: white;
          font-size: 10px;
          white-space: nowrap;
          padding: 3px 7px;
          border-radius: 6px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.12s;
          font-family: 'DM Sans', sans-serif;
          z-index: 20;
        }
        .rte-btn:hover::after { opacity: 1; }

        .rte-sep {
          width: 1px; height: 18px;
          background: #cfc5b8;
          margin: 0 4px;
          flex-shrink: 0;
        }

        /* Link input row */
        .rte-link-row {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px;
          border-top: 1px solid #ddd3c5;
          background: #e8ddd0;
          animation: rteSlide 0.14s ease;
        }
        @keyframes rteSlide {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rte-link-input {
          flex: 1;
          background: #f5efe7;
          border: 1px solid #d4c9bc;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 12px;
          color: #3a2e2a;
          outline: none;
          font-family: 'DM Sans', sans-serif;
        }
        .rte-link-input:focus { border-color: #c2602a; }
        .rte-link-go {
          padding: 6px 12px;
          background: #5a3825; color: white;
          border: none; border-radius: 8px;
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .rte-link-cancel {
          padding: 6px 10px;
          background: transparent; color: #8a7a70;
          border: none; border-radius: 8px;
          font-size: 12px; cursor: pointer;
        }

        /* Editable body */
        .rte-editor {
          padding: 12px 14px;
          outline: none;
          font-size: 14px;
          line-height: 1.65;
          color: #3a2e2a;
          min-height: ${minHeight}px;
          font-family: 'DM Sans', sans-serif;
          word-break: break-word;
        }
        .rte-editor:empty::before {
          content: attr(data-placeholder);
          color: #b0a090;
          pointer-events: none;
          font-size: 13px;
        }
        .rte-editor a { color: #c2602a; text-decoration: underline; text-underline-offset: 2px; }
        .rte-editor b, .rte-editor strong { font-weight: 700; }
        .rte-editor i, .rte-editor em { font-style: italic; }
        .rte-editor u { text-decoration: underline; text-underline-offset: 2px; }

        /* Highlight */
        .rte-editor mark {
          background: #fef08a;
          color: #713f12;
          border-radius: 3px;
          padding: 1px 2px;
        }

        /* Lists */
        .rte-editor ul { list-style: disc; padding-left: 20px; margin: 4px 0; }
        .rte-editor ol { list-style: decimal; padding-left: 20px; margin: 4px 0; }
        .rte-editor li { margin: 2px 0; }

        /* Divider */
        .rte-editor hr {
          border: none;
          border-top: 1.5px dashed #c9b99e;
          margin: 10px 0;
        }
      `}</style>

      {/* ── Toolbar ── */}
      <div className="rte-toolbar" onMouseDown={(e) => e.preventDefault()}>
        <button
          type="button"
          data-tip="Bold"
          className={`rte-btn${activeFormats.has("bold") ? " rte-active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            exec("bold");
          }}
        >
          <Bold size={14} />
        </button>

        <button
          type="button"
          data-tip="Italic"
          className={`rte-btn${activeFormats.has("italic") ? " rte-active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            exec("italic");
          }}
        >
          <Italic size={14} />
        </button>

        <button
          type="button"
          data-tip="Underline"
          className={`rte-btn${activeFormats.has("underline") ? " rte-active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            exec("underline");
          }}
        >
          <Underline size={14} />
        </button>

        <button
          type="button"
          data-tip="Highlight"
          className={`rte-btn${activeFormats.has("highlight") ? " rte-active-hl" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            toggleHighlight();
          }}
        >
          <Highlighter size={14} />
        </button>

        <div className="rte-sep" />

        <button
          type="button"
          data-tip="Bullet list"
          className={`rte-btn${activeFormats.has("ul") ? " rte-active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertUnorderedList");
          }}
        >
          <List size={14} />
        </button>

        <button
          type="button"
          data-tip="Numbered list"
          className={`rte-btn${activeFormats.has("ol") ? " rte-active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertOrderedList");
          }}
        >
          <ListOrdered size={14} />
        </button>

        <div className="rte-sep" />

        <button
          type="button"
          data-tip="Divider line"
          className="rte-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            insertDivider();
          }}
        >
          <Minus size={14} />
        </button>

        <div className="rte-sep" />

        {activeFormats.has("link") ? (
          <button
            type="button"
            data-tip="Remove link"
            className="rte-btn rte-active"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("unlink");
            }}
          >
            <Link2Off size={14} />
          </button>
        ) : (
          <button
            type="button"
            data-tip="Add link"
            className={`rte-btn${showLinkInput ? " rte-active" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              openLinkInput();
            }}
          >
            <Link size={14} />
          </button>
        )}
      </div>

      {/* ── Link input ── */}
      {showLinkInput && (
        <div className="rte-link-row">
          <input
            className="rte-link-input"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleLinkInsert();
              }
              if (e.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
            autoFocus
          />
          <button
            type="button"
            className="rte-link-go"
            onClick={handleLinkInsert}
          >
            Add
          </button>
          <button
            type="button"
            className="rte-link-cancel"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── Editable area ── */}
      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onSelect={updateActiveFormats}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Read-only display — plan detail + review step
// ─────────────────────────────────────────────

export function RichTextDisplay({
  html,
  variant = "dark",
}: {
  html: string;
  /** "dark" = white text on hero image; "light" = brown text on card */
  variant?: "dark" | "light";
}) {
  if (!html) return null;
  return (
    <>
      <style>{`
        .rtd { font-size: 14px; line-height: 1.65; font-family: 'DM Sans', sans-serif; word-break: break-word; padding:10px 4px }

        /* Dark (hero) */
        .rtd-dark { color: rgba(255,255,255,0.88); }
        .rtd-dark a { color: #fbbf24; text-decoration: underline; text-underline-offset: 2px; word-break: break-all; }
        .rtd-dark b, .rtd-dark strong { color: white; font-weight: 700; }
        .rtd-dark i, .rtd-dark em { font-style: italic; }
        .rtd-dark u { text-decoration: underline; text-underline-offset: 2px; }
        .rtd-dark li { color: rgba(255,255,255,0.85); }
        .rtd-dark hr { border-top: 1.5px dashed rgba(255,255,255,0.22); }

        /* Light (card) */
        .rtd-light { color: #5c4a38; }
        .rtd-light a { color: #c2602a; text-decoration: underline; text-underline-offset: 2px; word-break: break-all; }
        .rtd-light b, .rtd-light strong { color: #1a1410; font-weight: 700; }
        .rtd-light i, .rtd-light em { font-style: italic; }
        .rtd-light u { text-decoration: underline; text-underline-offset: 2px; }
        .rtd-light li { color: #5c4a38; }
        .rtd-light hr { border-top: 1.5px dashed #c9b99e; }

        /* Shared */
        .rtd p { margin: 0 0 5px; }
        .rtd p:last-child { margin-bottom: 0; }
        .rtd div { margin: 0 0 3px; }

        /* Highlight — same on both variants */
        .rtd mark {
          background: #fef08a;
          color: #713f12;
          border-radius: 3px;
          padding: 1px 3px;
        }

        /* Lists */
        .rtd ul { list-style: disc; padding-left: 20px; margin: 4px 0 8px; }
        .rtd ol { list-style: decimal; padding-left: 20px; margin: 4px 0 8px; }
        .rtd li { margin: 3px 0; }

        /* Divider */
        .rtd hr { border: none; margin: 10px 0; }
      `}</style>
      <div
        className={`rtd ${variant === "light" ? "rtd-light" : "rtd-dark"}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Sanitizer — keeps only safe tags + attributes
// ─────────────────────────────────────────────

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;

  const allowed = new Set([
    "B",
    "STRONG",
    "I",
    "EM",
    "U",
    "A",
    "MARK",
    "BR",
    "P",
    "SPAN",
    "DIV",
    "UL",
    "OL",
    "LI",
    "HR",
  ]);

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as Element;

      if (!allowed.has(el.tagName)) {
        // Unwrap — keep inner text/nodes
        const frag = document.createDocumentFragment();
        while (el.firstChild) frag.appendChild(el.firstChild);
        node.replaceChild(frag, el);
        continue;
      }

      // Strip unsafe attributes
      const remove: string[] = [];
      for (const attr of Array.from(el.attributes)) {
        const safe =
          el.tagName === "A" && ["href", "target", "rel"].includes(attr.name);
        if (!safe) remove.push(attr.name);
      }
      remove.forEach((a) => el.removeAttribute(a));

      if (el.tagName === "A") {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
        const href = el.getAttribute("href") || "";
        if (!/^https?:\/\//i.test(href)) el.removeAttribute("href");
      }

      walk(el);
    }
  };

  walk(div);
  return div.innerHTML;
}
