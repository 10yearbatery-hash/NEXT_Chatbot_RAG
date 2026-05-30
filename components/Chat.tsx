"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { CharacterCard } from "@/components/CharacterCard";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { AccessCodeModal } from "@/components/AccessCodeModal";
import { IngestPanel } from "@/components/IngestPanel";
import { SourcePanel } from "@/components/SourcePanel";
import { characterConfig } from "@/lib/ai/prompts";
import type { RetrievedChunk } from "@/lib/ai/rag";

export function Chat() {
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sources, setSources] = useState<RetrievedChunk[]>([]);
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  // useChat은 마운트 시점의 transport를 잡아두므로, accessCode는
  // transport 재생성 대신 매 sendMessage의 options.body로 전달한다.
  const transport = new DefaultChatTransport({ api: "/api/chat" });

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (accessCode && pendingMessage) {
      sendMessage({ text: pendingMessage }, { body: { accessCode } });
      setLastQuery(pendingMessage);
      setPendingMessage(null);
    }
  }, [accessCode, pendingMessage, sendMessage]);

  useEffect(() => {
    if (status !== "ready" || !lastQuery || !accessCode) return;
    const query = lastQuery;
    setLastQuery(null);
    (async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, accessCode }),
        });
        const data = await res.json();
        setSources(res.ok ? (data.chunks ?? []) : []);
      } catch {
        setSources([]);
      }
    })();
  }, [status, lastQuery, accessCode]);

  function handleSend(text: string) {
    if (!accessCode) {
      setPendingMessage(text);
      setShowModal(true);
      return;
    }
    sendMessage({ text }, { body: { accessCode } });
    setLastQuery(text);
  }

  function handleClear() {
    setMessages([]);
  }

  function handleLock() {
    setAccessCode(null);
    setPendingMessage(null);
  }

  function handleUnlockSubmit(code: string) {
    setAccessCode(code);
    setShowModal(false);
  }

  function handleCancelModal() {
    setShowModal(false);
    setPendingMessage(null);
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-4 p-4 md:flex-row md:p-6">
      <div className="flex flex-col gap-3 md:w-72 md:shrink-0">
        <CharacterCard character={characterConfig} />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            대화 초기화
          </button>
          <button
            type="button"
            onClick={handleLock}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            title="access code를 비워서 다음 전송 때 다시 입력하게 합니다"
          >
            잠금
          </button>
        </div>

        {/* accessCode가 있어야 /api/ingest·/api/search 가 통과하므로 그때만 노출 */}
        {accessCode ? (
          <>
            <IngestPanel accessCode={accessCode} />
            <SourcePanel chunks={sources} />
          </>
        ) : null}
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

      {showModal ? (
        <AccessCodeModal
          onUnlock={handleUnlockSubmit}
          onCancel={handleCancelModal}
        />
      ) : null}
    </div>
  );
}
