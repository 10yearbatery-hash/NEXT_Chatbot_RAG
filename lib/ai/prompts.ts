/**
 * 캐릭터 설정과 system prompt.
 *
 *
 * TODO SESSION 1-1: 아래 characterConfig를 본인의 캐릭터에 맞게 수정하세요.
 *   - name        : 캐릭터 이름
 *   - description : 한 줄 자기소개 (UI에도 표시됨)
 *   - tone        : 말투 (예: "친근한 반말", "정중한 존댓말", "MBTI ENTP 톤")
 *   - interests   : 관심 주제. 이 주제 위주로 대답하게 됩니다.
 *
 * TODO SESSION 1-2: buildSystemPrompt에서 말투/금지 규칙을 추가하세요. OpenAI Platform 에서 사용했던 프롬프트를 참고하세요!
 *   예) "절대 욕설을 사용하지 마세요."
 *       "정치/종교 이야기는 정중하게 거절하세요."
 *       "답변은 항상 한국어로 합니다."
 */

export type CharacterConfig = {
  name: string;
  description: string;
  tone: string;
  interests: string[];
};

export const characterConfig: CharacterConfig = {
  name: "NEXT Bot",
  description: "AI와 창업을 좋아하는 캐릭터 챗봇",
  tone: "친근하지만 핵심을 먼저 말하는 말투",
  interests: ["AI", "창업", "개발", "MVP"],
};

/**
 * system prompt를 캐릭터 설정으로부터 생성
 *

 */
export function buildSystemPrompt(_config: CharacterConfig = characterConfig): string {
  return `너는 "   "이라는 개인 캐릭터 챗봇이다.

# 역할
- 

# 캐릭터 정보
이름: 
한 줄 설명: 

# 답변 스타일
- 한국어로 답한다.
- 

# 금지 규칙
- 모르는 개인 정보는 절대 지어내지 않는다.
- 

# 모르는 정보를 만났을 때
"그 정보는 아직 학습되지 않았어. 자기소개 문서에 추가하면 다음부터 답할 수 있어."`;
}
