import { chunkText } from "@/lib/utils/chunk";
import { createEmbedding, createEmbeddings } from "@/lib/ai/embeddings";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type RetrievedChunk = {
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
};

type DocumentRow = {
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
};

type MatchRow = {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
};

// TODO SESSION 2-3: chunk → embed → documents 테이블 insert.
export async function ingestDocument(text: string): Promise<void> {
  const chunks = chunkText(text);
  console.log("[DEBUG ingest] input text length:", text.length);
  console.log("[DEBUG ingest] chunks created:", chunks.length);
  chunks.forEach((c, i) =>
    console.log(`[DEBUG ingest] chunk[${i}] len=${c.length} preview="${c.slice(0, 60)}..."`),
  );
  if (chunks.length === 0) return;

  const embeddings = await createEmbeddings(chunks);
  console.log("[DEBUG ingest] embeddings returned:", embeddings.length);
  embeddings.forEach((e, i) =>
    console.log(`[DEBUG ingest] embedding[${i}] dim=${e.length} first3=[${e.slice(0, 3).join(", ")}]`),
  );

  const rows: DocumentRow[] = chunks.map((content, i) => ({
    content,
    metadata: { chunk_index: i },
    embedding: embeddings[i],
  }));

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("documents").insert(rows);
  if (error) {
    console.error("[DEBUG ingest] insert ERROR:", error);
    throw new Error(`문서 저장 실패: ${error.message}`);
  }
  console.log("[DEBUG ingest] insert OK,", rows.length, "rows");
}

// TODO SESSION 2-5: 질문 embed → match_documents RPC 호출.
export async function retrieveRelevantChunks(
  query: string,
  topK: number = 4,
): Promise<RetrievedChunk[]> {
  console.log("[DEBUG retrieve] query:", JSON.stringify(query));
  const queryEmbedding = await createEmbedding(query);
  console.log(
    `[DEBUG retrieve] query embedding dim=${queryEmbedding.length} first3=[${queryEmbedding.slice(0, 3).join(", ")}]`,
  );

  const supabase = getSupabaseAdminClient();

  // ⚠️ Supabase RPC는 number[]를 vector 타입으로 자동 변환 못하는 경우가 있다.
  // pgvector가 인식하는 문자열 리터럴 "[v1,v2,...]"으로 명시적 변환.
  const embeddingString = `[${queryEmbedding.join(",")}]`;
  // match_threshold 0.5는 한국어 + 짧은 질문에선 너무 엄격하다. 0.1로 낮춰 회수율을 살림.
  const rpcParams = {
    query_embedding: embeddingString,
    match_threshold: 0.1,
    match_count: topK,
  };
  console.log(
    `[DEBUG retrieve] rpc params: threshold=${rpcParams.match_threshold} count=${rpcParams.match_count} embedding_string_len=${embeddingString.length}`,
  );
  const { data, error } = await supabase.rpc("match_documents", rpcParams);
  if (error) {
    console.error("[DEBUG retrieve] rpc ERROR:", error);
    throw new Error(`유사 chunk 검색 실패: ${error.message}`);
  }
  console.log("[DEBUG retrieve] rpc raw data:", JSON.stringify(data));
  console.log("[DEBUG retrieve] result count:", (data ?? []).length);

  return ((data ?? []) as MatchRow[]).map((row) => ({
    content: row.content,
    similarity: row.similarity,
    metadata: row.metadata,
  }));
}

// TODO SESSION 2-6: 안내문 + 번호 매긴 chunk로 context 조립.
export function buildRagContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";

  const facts = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n");
  return [
    "# 사용자에 대한 사실 (자기소개 문서에서 검색됨)",
    "아래 정보에 근거해서만 개인적인 사실을 답하라.",
    "여기에 없는 개인 정보는 모른다고 답하고, 지어내지 마라.",
    "",
    facts,
  ].join("\n");
}
