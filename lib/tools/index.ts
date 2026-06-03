import { tool } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createEmbedding } from "@/lib/ai/embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const restaurantTools = {
  search_restaurants: tool({
    description: "자연어로 8000원 클럽 식당 검색. 예: '국수 먹고 싶어', '이캠 근처 밥집', '가장 싼 곳'",
    inputSchema: z.object({
      query: z.string().describe("자연어 검색 쿼리"),
      top_k: z.number().int().default(5)
    }),
    execute: async ({ query, top_k }) => {
      const embedding = await createEmbedding(query);
      const { data } = await supabase.rpc('match_restaurants', {
        query_embedding: embedding,
        match_threshold: 0.3,
        match_count: top_k
      });
      return data ?? [];
    }
  }),

  filter_restaurants: tool({
    description: "카테고리·가격·캠퍼스 조건으로 식당 필터링. 예: '한식', '7000원 이하', '이캠'",
    inputSchema: z.object({
      category: z.enum(["한식","일식","패스트푸드","기타"]).optional(),
      max_price: z.number().int().optional().describe("최대 가격 (price_max 기준)"),
      campus: z.enum(["문캠","이캠"]).optional().describe("문캠=문과캠퍼스, 이캠=이과캠퍼스")
    }),
    execute: async ({ category, max_price, campus }) => {
      let query = supabase.from('restaurants').select('*');
      if (category) query = query.eq('category', category);
      if (max_price) query = query.lte('price_max', max_price);
      if (campus === "문캠") query = query.ilike('location', '%문과 캠퍼스%');
      if (campus === "이캠") query = query.ilike('location', '%이과 캠퍼스%');
      const { data } = await query.limit(10);
      return data ?? [];
    }
  }),

  get_restaurant_detail: tool({
    description: "특정 식당 상세 정보 조회. search_restaurants 또는 filter_restaurants 결과의 restaurant_id 사용",
    inputSchema: z.object({
      restaurant_id: z.string()
    }),
    execute: async ({ restaurant_id }) => {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurant_id)
        .single();
      return data;
    }
  })
};
