/**
 *
 * TODO SESSION 1-5: 본인 캐릭터의 응답 길이에 맞춰
 * MAX_OUTPUT_TOKENS를 조정해보세요. 너무 크게 잡으면 비용이 빠르게 늘어납니다.
 */

// 사용자가 한 번에 보낼 수 있는 메시지 최대 글자 수.
// 너무 길면 토큰 비용이 커지고, 모델 응답도 느려집니다.
export const MAX_INPUT_CHARS = 500;

// 모델이 한 번에 생성할 수 있는 최대 출력 토큰 수.
export const MAX_OUTPUT_TOKENS = 500;

// 사용할 모델 이름.
// 기본은 가장 저렴한 gpt-4o-mini입니다.
// TODO SESSION 1-6: 알맞은 모델을 선택해서 넣어주세요.

// 다른 후보:
//   - "gpt-4o-mini"  (저렴, 빠름, 기본값)
//   - "gpt-4o"       (똑똑함, 비쌈)

export const MODEL_NAME = "gpt-4o-mini";

// 대화 히스토리에 포함할 최근 메시지 수.
// 너무 길면 매 요청마다 토큰을 많이 먹습니다.
export const MAX_HISTORY_MESSAGES = 20;

// 답변의 무작위성(창의성). 0~2 사이.
//   - 0    : 같은 질문에 거의 항상 같은 답 (사실 조회, 코드 생성 등에 유리)
//   - 0.7  : 자연스러운 균형 (기본값)
//   - 1~1.3: 다양하고 창의적인 답
//   - 2    : 헛소리에 가까워짐
//
// TODO SESSION 1-7 (선택): 0, 0.7, 1.5로 바꿔가며 답변이 어떻게 달라지는지 비교해보세요.
//   같은 질문을 여러 번 보내보면 차이가 잘 보입니다.
export const TEMPERATURE = 0.7;
