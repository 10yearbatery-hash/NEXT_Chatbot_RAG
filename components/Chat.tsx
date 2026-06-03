"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";

export function Chat() {
  const transport = new DefaultChatTransport({ api: "/api/chat" });

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
  });

  const isBusy = status === "submitted" || status === "streaming";

  function handleSend(text: string) {
    sendMessage({ text });
  }

  function handleClear() {
    setMessages([]);
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-4 p-4 md:flex-row md:p-6">
      <div className="flex flex-col gap-3 md:w-72 md:shrink-0">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">💸 8000원 클럽</h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">고려대 근처 만원 이하 가성비 밥집</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            대화 초기화
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex-1 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <MessageList messages={messages} isStreaming={status === "streaming"} />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            오류: {error.message}
          </div>
        ) : null}

        <MessageInput onSend={handleSend} disabled={isBusy} />
      </div>
    </div>
  );
}
