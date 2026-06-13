import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface AnalysisResponse {
  menu: string;
}

/**
 * 診断用：このAPIキーで使えるモデル一覧を取得する
 * ブラウザで http://localhost:3000/api/analyze-food にアクセスすると確認できる
 */
export async function GET() {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 500 });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
  );
  const data = await res.json();

  // generateContent をサポートしているモデルだけ抽出
  const usableModels = (data.models || [])
    .filter((m: { supportedGenerationMethods?: string[] }) =>
      m.supportedGenerationMethods?.includes('generateContent')
    )
    .map((m: { name: string }) => m.name);

  return NextResponse.json({ usableModels, raw: data });
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'APIキーが設定されていません' },
        { status: 500 }
      );
    }

    // リクエストボディから画像とメタデータを取得
    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: '画像データが不足しています' },
        { status: 400 }
      );
    }

    // Gemini APIに送信
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: '写真に写っているメニュー（食べ物）を見て、日本語で簡潔に説明してください。メニュー名や食べ物の名前だけを返してください。複数の食べ物がある場合は「、」で区切ってください。例：「ハンバーグ、サラダ、味噌汁」',
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API エラー:', errorData);
      return NextResponse.json(
        { error: 'APIレスポンスエラー' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // レスポンスから生成されたテキストを抽出
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      return NextResponse.json(
        { error: 'メニューの解析に失敗しました' },
        { status: 400 }
      );
    }

    const result: AnalysisResponse = {
      menu: text.trim(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('分析エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
