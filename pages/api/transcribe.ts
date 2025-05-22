import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import OpenAI from "openai";
import fs from "fs";

// 이거 설정 해줘야 밑에 formidable로 parsing하는 부분이랑 충돌이 안생긴다.
// next.js 자체의 body parser를 꺼주는 내용.
export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // 순서
  // 1. Input: audio input (formidable 라이브러리 활용)
  // 2. OpenAI: audio -> text
  // 3. Output: text
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const form = formidable({
    // 파일 데이터의 익스텐션을 인클루드 할건지 여부
    keepExtensions: true,
  });

  form.parse(req, async (error, fields, files) => {
    if (error) return res.status(500).json({ error: "Form parsing error" });

    const file = files.file?.[0];
    if (file == null) {
      console.error("File is undefined");
      return res.status(500).json({ error: "Transcription failed" });
    }

    try {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(file.filepath),
        // 어떤 모델쓸건지
        model: "whisper-1",
        // 변환할 언어. 넣어줘야 좀 더 정확한 결과가 나온다고 함.
        language: "ko",
        // 기본적으론 그냥 텍스트만 변환돼서 반환하는데 이 설정 넣어주면 시간 정보도 받을 수 있음.
        response_format: "verbose_json",
      });

      console.log("transcription", transcription);
      return res.status(200).json({ transcription });
    } catch (error: any) {
      console.error("error", error);
      return res.status(500).json({ error: error.message });
    } finally {
      // 파일 지워주기
      fs.unlinkSync(file.filepath);
    }
  });
};

export default handler;
