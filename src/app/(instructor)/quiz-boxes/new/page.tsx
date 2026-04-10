"use client";

import { useState } from "react";
import { QuizGenerator } from "@/components/quiz-generator";
import { QuizEditor } from "@/components/quiz-editor";
import { createQuizBox } from "@/lib/actions/quiz-boxes";
import type { QuizGenerationOutput } from "@/lib/ai/schemas";

export default function NewQuizBoxPage() {
  const [generated, setGenerated] = useState<{ data: QuizGenerationOutput; topic: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(formData: FormData) {
    setSaving(true);
    await createQuizBox(formData);
  }

  if (!generated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <QuizGenerator onGenerated={(data, topic) => setGenerated({ data, topic })} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <QuizEditor initialData={generated.data} topic={generated.topic} onSave={handleSave} saving={saving} />
    </div>
  );
}
