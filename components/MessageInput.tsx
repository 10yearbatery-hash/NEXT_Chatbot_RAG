"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { MAX_INPUT_CHARS } from "@/lib/utils/limits";

/**
 * 메시지 입력창.
 *
 * - Enter 전송 / Shift+Enter 줄바꿈
 * - 글자 수 카운터 표시 (MAX_INPUT_CHARS 초과 시 빨간색)
 * - 전송 중에는 비활성화
 */
export function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  const isTooLong = value.length > MAX_INPUT_CHARS;
  const canSend = value.trim().length > 0 && !isTooLong && !disabled;

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder="메시지를 입력하세요. (Enter 전송, Shift+Enter 줄바꿈)"
        className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
        disabled={disabled}
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-0.5">
        <span
          className={`text-xs ${
            isTooLong
              ? "text-red-500"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {value.length} / {MAX_INPUT_CHARS}
        </span>
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? "생성중..." : "전송"}
        </button>
      </div>
    </form>
  );
}
