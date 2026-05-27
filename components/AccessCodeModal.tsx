"use client";

import { useState, type FormEvent } from "react";

/**
 * access code 입력 모달.
 *
 * 처음 메시지를 보낼 때 띄워서 코드를 받고,
 * 이후 같은 세션 동안에는 메모리에 저장된 값을 자동 사용한다.
 *
 * 주의:
 *   - 이 모달은 "비용 보호" 용도일 뿐, 진짜 보안용 인증이 아니다.
 *     실제 서비스에서는 NextAuth / Supabase Auth 등 정식 인증을 써야 한다.
 *   - 새로고침하거나 "잠금"을 누르면 메모리가 비워져 다시 입력해야 한다.
 */
export function AccessCodeModal({
  onUnlock,
  onCancel,
}: {
  onUnlock: (code: string) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (code.trim().length === 0) return;
    onUnlock(code.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Access code
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            챗봇을 사용하려면 운영자에게 받은 코드를 입력하세요.
          </p>
        </div>

        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="access code"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          autoFocus
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={code.trim().length === 0}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            확인 후 전송
          </button>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          코드는 서버 환경변수와 비교됩니다. 새로고침/잠금 시 다시 입력해야 합니다.
        </p>
      </form>
    </div>
  );
}
