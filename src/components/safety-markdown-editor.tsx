"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-[#F8F9FB] p-4 text-sm text-[#9CA3AF]">
      에디터 로딩 중...
    </div>
  ),
});

interface SafetyMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}

export function SafetyMarkdownEditor({
  value,
  onChange,
  minHeight = 300,
}: SafetyMarkdownEditorProps) {
  return (
    <div data-color-mode="light" className="safety-md-editor">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v || "")}
        height={minHeight}
        preview="live"
      />
    </div>
  );
}
