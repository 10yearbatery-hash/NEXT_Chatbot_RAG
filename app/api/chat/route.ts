import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { chatModel } from "@/lib/ai/model";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { retrieveRelevantChunks, buildRagContext } from "@/lib/ai/rag";
import {
  MAX_INPUT_CHARS,
  MAX_OUTPUT_TOKENS,
  MAX_HISTORY_MESSAGES,
  TEMPERATURE,
} from "@/lib/utils/limits";

export const runtime = "nodejs";

type ChatRequestBody = {
  messages: UIMessage[];
  accessCode?: string;
};

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { messages, accessCode } = body;

  const expectedCode = process.env.APP_ACCESS_CODE;
  if (!expectedCode) {
    return Response.json(
      { error: "서버에 APP_ACCESS_CODE가 설정되어 있지 않습니다. .env.local 또는 Vercel 환경변수를 확인하세요." },
      { status: 500 },
    );
  }
  if (!accessCode || accessCode !== expectedCode) {
    return Response.json(
      { error: "access code가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY가 설정되어 있지 않습니다. .env.local 또는 Vercel 환경변수에 키를 추가하세요." },
      { status: 500 },
    );
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "메시지가 비어 있습니다." }, { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];
  const lastText = extractText(lastMessage);
  if (lastText.length > MAX_INPUT_CHARS) {
    return Response.json(
      { error: `메시지가 너무 깁니다. ${MAX_INPUT_CHARS}자 이하로 줄여주세요.` },
      { status: 400 },
    );
  }

  const trimmedMessages = messages.slice(-MAX_HISTORY_MESSAGES);

  // TODO SESSION 3-4: classifyQuestion(lastText)으로 "rag" | "web" | "direct" 분기.
  //   import { classifyQuestion } from "@/lib/ai/router";
  // TODO SESSION 3-4 (web 분기): searchWeb → buildWebContext로 system prompt에 추가.
  //   import { searchWeb, buildWebContext } from "@/lib/tavily/search";
  let systemPrompt = buildSystemPrompt();

  // TODO SESSION 2-6: 유사 chunk를 검색해 system prompt에 덧붙인다.
  console.log("[DEBUG chat] lastText:", JSON.stringify(lastText));
  try {
    const chunks = await retrieveRelevantChunks(lastText);
    console.log("[DEBUG chat] retrieved chunks count:", chunks.length);
    chunks.forEach((c, i) =>
      console.log(
        `[DEBUG chat] chunk[${i}] sim=${c.similarity.toFixed(4)} content="${c.content.slice(0, 80)}..."`,
      ),
    );
    const ragContext = buildRagContext(chunks);
    console.log("[DEBUG chat] ragContext length:", ragContext.length);
    if (ragContext) {
      systemPrompt = `${systemPrompt}\n\n${ragContext}`;
    }
    console.log("[DEBUG chat] final systemPrompt length:", systemPrompt.length);
    console.log("[DEBUG chat] final systemPrompt:\n", systemPrompt);
  } catch (err) {
    console.error("[DEBUG chat] RAG 검색 실패 (RAG 없이 진행):", err);
  }

  try {
    const modelMessages = await convertToModelMessages(trimmedMessages);
    const result = streamText({
      model: chatModel,
      system: systemPrompt,
      messages: modelMessages,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE,
    });
    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[/api/chat] streamText 실패:", err);
    return Response.json(
      { error: "모델 호출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. (서버 로그를 확인하세요)" },
      { status: 500 },
    );
  }
}

function extractText(message: UIMessage): string {
  if (!message?.parts) return "";
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}
