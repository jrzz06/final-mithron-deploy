"use client";

import { Bold, Italic, Link2, List, ListOrdered, Underline } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function ProductSimpleRichText({
  name,
  defaultValue = "",
  placeholder = "Describe this product...",
  className = ""
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);

  useEffect(() => {
    if (editorRef.current && defaultValue && !editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = defaultValue;
      setHtml(defaultValue);
    }
  }, [defaultValue]);

  function syncHtml() {
    const next = editorRef.current?.innerHTML ?? "";
    setHtml(next);
  }

  function addLink() {
    const url = window.prompt("Enter link URL");
    if (!url?.trim()) return;
    exec("createLink", url.trim());
    syncHtml();
  }

  return (
    <div className={className} data-product-rich-text>
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-slate-200 bg-slate-50 px-2 py-1.5">
        <button type="button" onClick={() => { exec("bold"); syncHtml(); }} className="rounded p-1.5 text-slate-600 hover:bg-white" aria-label="Bold">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => { exec("italic"); syncHtml(); }} className="rounded p-1.5 text-slate-600 hover:bg-white" aria-label="Italic">
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => { exec("underline"); syncHtml(); }} className="rounded p-1.5 text-slate-600 hover:bg-white" aria-label="Underline">
          <Underline className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={addLink} className="rounded p-1.5 text-slate-600 hover:bg-white" aria-label="Insert link">
          <Link2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => { exec("insertUnorderedList"); syncHtml(); }} className="rounded p-1.5 text-slate-600 hover:bg-white" aria-label="Bulleted list">
          <List className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => { exec("insertOrderedList"); syncHtml(); }} className="rounded p-1.5 text-slate-600 hover:bg-white" aria-label="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncHtml}
        onBlur={syncHtml}
        data-placeholder={placeholder}
        className="min-h-[140px] max-h-[280px] overflow-y-auto rounded-b-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none focus:border-slate-400 empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
      />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
