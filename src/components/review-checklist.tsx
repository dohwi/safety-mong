"use client";

import { useState } from "react";

const CHECKLIST_ITEMS = [
  "모든 문제의 정답을 확인했습니다",
  "안전수칙 내용이 정확한지 확인했습니다",
  "선택지에 중복이나 오류가 없는지 확인했습니다",
  "해설이 올바른지 확인했습니다",
];

export function ReviewChecklist({ onComplete }: { onComplete: (complete: boolean) => void }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    const next = new Set(checked);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setChecked(next);
    onComplete(next.size === CHECKLIST_ITEMS.length);
  }

  return (
    <div className="border border-[#c1c1c1] rounded-2xl p-5 space-y-3">
      <h2 className="text-lg font-semibold text-[#222222]">검수 체크리스트</h2>
      {CHECKLIST_ITEMS.map((item, i) => (
        <label key={i} className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked.has(i)}
            onChange={() => toggle(i)}
            className="mt-0.5 w-4 h-4 rounded border-[#c1c1c1] text-[#3b82f6] focus:ring-[#3b82f6]"
          />
          <span className="text-sm text-[#222222]">{item}</span>
        </label>
      ))}
    </div>
  );
}
