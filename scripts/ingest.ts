// 로컬 실행 전용: npx dotenv-cli -e .env.local -- npx tsx scripts/ingest.ts
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import restaurantsData from '../data/restaurants.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildContent(r: typeof restaurantsData[0]): string {
  return [
    `${r.name} (${r.category})`,
    `위치: ${r.location}`,
    `가격: ${r.price_range_label}`,
    `대표메뉴: ${(r.menu_highlights as string[]).join(', ')}`,
    r.description
  ].join('\n');
}

async function main() {
  let success = 0;
  for (const r of restaurantsData) {
    try {
      await supabase.from('restaurants').upsert(r);
      const content = buildContent(r);
      const { data } = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: content
      });
      await supabase.from('restaurant_documents').upsert({
        restaurant_id: r.id,
        content,
        embedding: data[0].embedding
      });
      console.log(`✓ [${++success}/${restaurantsData.length}] ${r.name}`);
    } catch (err) {
      console.error(`✗ ${r.name}:`, err);
    }
  }
  console.log(`\n완료: ${success}/${restaurantsData.length}`);
}

main().catch(console.error);
