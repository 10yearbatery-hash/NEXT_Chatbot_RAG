// TODO SESSION 2-2: embed/embedMany로 OpenAI embedding 생성.
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const EMBEDDING_MODEL = "text-embedding-3-small"; // schema.sql vector(1536)과 일치

export async function createEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: text,
  });
  return embedding;
}

export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const { embeddings } = await embedMany({
    model: openai.embedding(EMBEDDING_MODEL),
    values: texts,
  });
  return embeddings;
}
