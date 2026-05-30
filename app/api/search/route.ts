// TODO SESSION 2-8: retrieveRelevantChunks(query) 호출 후 결과 반환 (SourcePanel 확인용).
export const runtime = "nodejs";

type SearchBody = {
  query?: string;
  accessCode?: string;
};

export async function POST(req: Request) {
  let body: SearchBody;
  try {
    body = (await req.json()) as SearchBody;
  } catch {
    return Response.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const expectedCode = process.env.APP_ACCESS_CODE;
  if (!expectedCode || body.accessCode !== expectedCode) {
    return Response.json(
      { error: "access code가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  if (!body.query || body.query.trim().length === 0) {
    return Response.json({ error: "query가 비어 있습니다." }, { status: 400 });
  }

  try {
    const { retrieveRelevantChunks } = await import("@/lib/ai/rag");
    const chunks = await retrieveRelevantChunks(body.query);
    return Response.json({ chunks });
  } catch (err) {
    console.error("[/api/search] 검색 실패:", err);
    return Response.json(
      { error: "검색 중 오류가 발생했습니다. (서버 로그 확인)" },
      { status: 500 },
    );
  }
}
