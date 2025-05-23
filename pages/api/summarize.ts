import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { text } = req.body;

  try {
    // chatGPT 명령
    const data = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          // 유저가 입력한거다
          role: "user",
          // chatGPT에게 명령하는 부분
          content: `아래 내용을 한 문장으로 요약해줘:\n\n${text}`,
        },
      ],
    });

    // 결과 메시지 접근. 공백이 있을 수 있어서 trim까지 적용
    const summary = data.choices[0].message.content?.trim();
    res.status(200).json({ summary });
  } catch (error: any) {
    console.error("Summarize Error", error);
    res.status(500).json({ error: error.message });
  }
};

export default handler;
