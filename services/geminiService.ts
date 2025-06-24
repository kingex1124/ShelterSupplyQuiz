
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Question, UserAnswers, EvaluationResult, RawQuestion, GeneratedQuestionsResponse } from '../types';
import { GEMINI_MODEL_QUESTION_GEN, GEMINI_MODEL_EVALUATION, TOTAL_QUESTIONS } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set. Please set it before running the application.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function parseJsonFromGeminiResponse(text: string): any {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; // Matches ```json ... ``` or ``` ... ```
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Original text:", text);
    throw new Error("AI回傳的資料格式錯誤，無法解析。");
  }
}

export const generateQuestions = async (): Promise<Question[]> => {
  const prompt = `
請為戰爭避難情境產生${TOTAL_QUESTIONS}個多選問題。這些問題總共應涵蓋所有戰爭民防必要的物資。
每個問題應有4到10個選項。每個選項應明確標示為 'essential' (必要), 'optional' (可有可無), 或 'non-essential' (非必要)。
請以繁體中文提供問題和選項。請確保每個問題和選項都有唯一的ID (例如 question id "q1", "q2", ..., option id "q1o1", "q1o2", ...)。

請以以下JSON格式回傳結果：
\`\`\`json
{
  "questions": [
    {
      "id": "q1",
      "theme": "問題主題 (例如：飲用水與食物)",
      "questionText": "問題的文本?",
      "options": [
        { "id": "q1o1", "text": "選項文本1", "category": "essential" },
        { "id": "q1o2", "text": "選項文本2", "category": "optional" }
      ]
    }
  ]
}
\`\`\`
確保 "questions" 陣列中剛好有 ${TOTAL_QUESTIONS} 個問題物件。
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_QUESTION_GEN,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const parsedData: GeneratedQuestionsResponse = parseJsonFromGeminiResponse(response.text);

    if (!parsedData.questions || parsedData.questions.length !== TOTAL_QUESTIONS) {
      console.error("Generated questions data is invalid:", parsedData);
      throw new Error(`AI未能產生預期的 ${TOTAL_QUESTIONS} 個問題。`);
    }
    
    // Validate structure of each question and option
    parsedData.questions.forEach(q => {
      if (!q.id || !q.theme || !q.questionText || !q.options || q.options.length < 4 || q.options.length > 10) {
        throw new Error("AI產生的問題結構不完整。");
      }
      q.options.forEach(opt => {
        if (!opt.id || !opt.text || !['essential', 'optional', 'non-essential'].includes(opt.category)) {
          throw new Error("AI產生的選項結構不完整或類別錯誤。");
        }
      });
    });

    return parsedData.questions as Question[]; // Cast after validation
  } catch (error) {
    console.error("Error generating questions:", error);
    if (error instanceof Error) {
       throw new Error(`生成問題時發生錯誤: ${error.message}`);
    }
    throw new Error("生成問題時發生未知錯誤。");
  }
};

export const evaluateAnswers = async (questions: Question[], userAnswers: UserAnswers): Promise<EvaluationResult> => {
  const questionsForPrompt = questions.map(q => ({
    id: q.id,
    questionText: q.questionText,
    options: q.options.map(opt => ({ id: opt.id, text: opt.text, category: opt.category }))
  }));

  const userAnswersForPrompt = userAnswers;

  const prompt = `
你是一位資深的戰爭避難物資專家。請根據以下使用者在一系列問題中的選擇，評估他們對戰爭避難所需物資的準備情況。

原始問題和正確分類如下 (category: 'essential' - 必要, 'optional' - 可有可無, 'non-essential' - 非必要):
\`\`\`json
${JSON.stringify(questionsForPrompt, null, 2)}
\`\`\`

使用者的答案如下 (格式為 { "questionId": ["selectedOptionId1", "selectedOptionId2", ...] }):
\`\`\`json
${JSON.stringify(userAnswersForPrompt, null, 2)}
\`\`\`

請提供以下評估（所有內容請使用繁體中文）：
1.  **選中的非必要物資** (\`selectedNonEssential\`): 列出使用者選擇的非必要物資，並解釋為何它們在戰爭避難情境中非必要或優先級較低。格式: \`{ "itemText": "物資名稱", "reason": "原因" }\`
2.  **選中的可有可無物資** (\`selectedOptional\`): 列出使用者選擇的可有可無物資，並解釋為何它們是可有可無（非絕對必要，但有其用處）。格式: \`{ "itemText": "物資名稱", "reason": "原因" }\`
3.  **遺漏的必要物資** (\`missedEssential\`): 指出使用者在各問題中未能選擇的必要物資，並解釋為何這些物資至關重要。格式: \`{ "questionText": "相關問題文本", "itemText": "物資名稱", "reason": "原因" }\`
4.  **必要物資遺漏總結** (\`summaryOfMissedEssentials\`): 總結所有問題中遺漏的必要物資類別，並強調其重要性。一個簡短段落。
5.  **正確選擇的物資** (\`correctlySelectedSummary\`): 整理使用者正確選擇的必要物資 (以及有益的可有可無物資)。格式: \`{ "questionText": "相關問題文本", "selectedItems": ["物資名稱1", "物資名稱2"] }\`
6.  **總體評估與建議** (\`overallFeedback\`): 對使用者的整體準備情況給出總結性評語和建議。一個簡短段落。
7.  **分數** (\`score\`): 根據上述評估，給予使用者一個0到100分的分數。請綜合考量選擇的正確性、遺漏的嚴重性來評分。

請嚴格以以下JSON格式回傳評估結果：
\`\`\`json
{
  "score": 0,
  "selectedNonEssential": [],
  "selectedOptional": [],
  "missedEssential": [],
  "summaryOfMissedEssentials": "",
  "correctlySelectedSummary": [],
  "overallFeedback": ""
}
\`\`\`
請確保JSON結構完整且所有欄位都已填寫。
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_EVALUATION,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsedData: EvaluationResult = parseJsonFromGeminiResponse(response.text);

    // Basic validation of the parsed data structure
    if (typeof parsedData.score !== 'number' ||
        !Array.isArray(parsedData.selectedNonEssential) ||
        !Array.isArray(parsedData.selectedOptional) ||
        !Array.isArray(parsedData.missedEssential) ||
        typeof parsedData.summaryOfMissedEssentials !== 'string' ||
        !Array.isArray(parsedData.correctlySelectedSummary) ||
        typeof parsedData.overallFeedback !== 'string') {
      console.error("Evaluation response structure is invalid:", parsedData);
      throw new Error("AI回傳的評估結果格式不正確。");
    }
    
    return parsedData;

  } catch (error) {
    console.error("Error evaluating answers:", error);
     if (error instanceof Error) {
       throw new Error(`評估答案時發生錯誤: ${error.message}`);
    }
    throw new Error("評估答案時發生未知錯誤。");
  }
};
    