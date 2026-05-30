-- =====================================================================
-- Supabase schema for Session 2 (RAG) — TODO SESSION 2-4
-- =====================================================================
-- 사용법:
--   1) Supabase 프로젝트 만들기 (https://supabase.com)
--   2) Dashboard → SQL Editor → New query
--   3) 이 파일 내용을 그대로 붙여넣고 Run
--   4) Table Editor에서 documents 테이블이 만들어졌는지 확인
--
-- 주의:
--   - 아래 `vector(1536)`은 OpenAI "text-embedding-3-small" 기준(1536 차원).
--   - 다른 모델을 쓰면 차원도 그에 맞게 바꿔야 합니다.
--     · text-embedding-3-small → 1536
--     · text-embedding-3-large → 3072
--   - lib/ai/embeddings.ts 에서 쓰는 모델과 반드시 일치시켜야 함.
-- =====================================================================


-- 1) pgvector 확장 활성화
--    Supabase는 기본 제공하지만 명시적으로 켜야 합니다.
create extension if not exists vector;


-- 2) documents 테이블
--    하나의 row = 자기소개 문서를 chunking한 한 조각.
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  content     text        not null,
  metadata    jsonb       not null default '{}'::jsonb,
  embedding   vector(1536) not null,        -- ← 모델 차원과 일치
  created_at  timestamptz not null default now()
);


-- 3) 유사도 검색용 인덱스 (옵션이지만 row 많아지면 필수)
--    cosine distance 기준. ivfflat은 row가 어느 정도 쌓인 뒤 만들면 효율적.
--
-- ⚠️ 주의: ivfflat은 데이터가 충분히 쌓인 뒤(최소 lists × 수십 배 이상)에 만들어야 합니다.
--    lists=100 이면 100개 클러스터로 나누는데, row가 4~10개뿐이면
--    기본 probes=1 로 1개 클러스터만 스캔 → 대부분의 row가 검색에서 누락됩니다.
--    개발/테스트 단계에서는 인덱스 없이 순차 스캔(sequential scan)을 사용하세요.
--    row가 수천 개 이상 쌓였을 때 아래 주석을 해제하고 실행하세요.
--
-- create index if not exists documents_embedding_idx
--   on public.documents
--   using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);


-- 4) match_documents RPC
--    사용자 질문 embedding과 코사인 유사도가 높은 chunk를 반환.
--    threshold로 잡음 chunk를 컷, match_count로 topK 조절.
create or replace function public.match_documents(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count     int   default 5
)
returns table (
  id         uuid,
  content    text,
  metadata   jsonb,
  similarity float
)
language sql stable
as $$
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
  order by d.embedding <=> query_embedding
  limit match_count;
$$;


-- 5) (선택) Row Level Security
--    개인 데모용이라면 RLS off로 두고 service role key로만 접근해도 OK.
--    공개 서비스라면 반드시 RLS를 켜고 정책을 작성하세요.
--
-- alter table public.documents enable row level security;
-- create policy "anon_read" on public.documents for select to anon using (true);
