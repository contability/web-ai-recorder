# chatGPT API 활용 클로바ST 녹음요약 앱 프로젝트 웹 파트

## 프로젝트 소개

이 프로젝트는 사용자의 음성 녹음을 텍스트로 변환하고 요약해주는 웹 애플리케이션이다. OpenAI의 ChatGPT API와 Whisper 모델을 활용하여 음성-텍스트 변환(STT)과 텍스트 요약 기능을 제공한다. 사용자는 웹 인터페이스를 통해 음성을 녹음하고, 녹음된 내용을 텍스트로 변환한 후 핵심 내용을 한 문장으로 요약받을 수 있다.

## 내용

- 웹 브라우저에서 음성 녹음
- 녹음된 오디오를 텍스트로 변환 (OpenAI Whisper API 활용)
- 텍스트 내용 요약 (ChatGPT API 활용)
- 녹음 기록 저장 및 관리

## 기술 스택

- Next.js 및 React
- TypeScript
- TailwindCSS
- OpenAI API (GPT-3.5 Turbo, Whisper)
