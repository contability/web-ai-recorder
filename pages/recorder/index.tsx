import { useDatabase } from "@/components/data-context";
import Header from "@/components/header";
import { formatTime } from "@/modules/util";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";

// base64를 blob으로 변환하는 함수.
const base64ToBlob = (base64: string, mimeType: string) => {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: mimeType });
};

const RecorderPage = () => {
  const router = useRouter();

  const [state, setState] = useState<"recording" | "paused" | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [time, setTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback(() => {
    setToastVisible(true);
  }, []);

  const { create } = useDatabase();

  const transcribeAudio = useCallback(
    async ({ url, extension }: { url: string; extension: string }) => {
      // url로 부터 blob을 가져와야 함.
      const response = await fetch(url);
      // 해당 오디오 blob
      const audioBlob = await response.blob();

      const formData = new FormData();
      formData.append("file", audioBlob, `recording.${extension}`);

      const transcriptionResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = (await transcriptionResponse.json()) as {
        transcription: {
          text: string;
          segments: Array<{ start: number; end: number; text: string }>;
        };
      };
      console.log(data);
      const id = `${Date.now()}`;
      create({
        id,
        text: data.transcription.text,
        scripts: data.transcription.segments.map((seg) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text.trim(),
        })),
        photos,
      });
      router.push(`/recording/${id}`);
    },
    [create, photos, router]
  );

  const onStartRecord = useCallback(() => {
    setTime(0);
    setAudioUrl(null);
    startTimer();
    setState("recording");
  }, [startTimer]);

  // url: 녹음이 저장될 주소
  const onStopRecord = useCallback(
    ({ url, extension }: { url: string; extension: string }) => {
      setAudioUrl(url);
      setState(null);
      stopTimer();
      showToast();
      transcribeAudio({ url, extension });
    },
    [showToast, stopTimer, transcribeAudio]
  );

  const onPauseRecord = useCallback(() => {
    stopTimer();
    setState("paused");
  }, [stopTimer]);

  const onResumeRecord = useCallback(() => {
    startTimer();
    setState("recording");
  }, [startTimer]);

  // ReactNativeWebview가 window 객체 안에 있다면 웹뷰를 이용해 앱으로 띄워졌다는 뜻.
  const hasReactNativeWebview =
    typeof window !== "undefined" && window.ReactNativeWebView !== undefined;

  const postMessageToRN = useCallback(
    ({ type, data }: { type: string; data?: any }) => {
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type, data }));
    },
    []
  );

  useEffect(() => {
    if (hasReactNativeWebview) {
      const handleMessage = (event: any) => {
        console.log("🚀 ~ handleMessage ~ event:", event);
        const { type, data } = JSON.parse(event.data);
        if (type === "onStartRecord") {
          onStartRecord();
        } else if (type === "onStopRecord") {
          const { audio, mimeType, ext } = data;
          const blob = base64ToBlob(audio, mimeType);
          const url = URL.createObjectURL(blob);

          onStopRecord({ url, extension: ext });
        } else if (type === "onPauseRecord") {
          onPauseRecord();
        } else if (type === "onResumeRecord") {
          onResumeRecord();
        } else if (type === "onTakePhoto") {
          setPhotos((prev) => prev.concat([data]));
        }
      };
      // 2개 다 넣어줘야 iOS, android 둘다 적용 됨.
      window.addEventListener("message", handleMessage);
      document.addEventListener("message", handleMessage);

      return () => {
        window.removeEventListener("message", handleMessage);
        document.removeEventListener("message", handleMessage);
      };
    }
  }, [
    hasReactNativeWebview,
    onPauseRecord,
    onResumeRecord,
    onStartRecord,
    onStopRecord,
  ]);

  const record = useCallback(() => {
    if (hasReactNativeWebview) {
      // 웹뷰를 통해 앱으로 띄워졌다면 앱으로 start-record라는 메시지를 보냄.
      postMessageToRN({ type: "start-record" });
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: false,
      })
      .then((stream) => {
        // 크롬에서 지원되는 형식. 사파리에서는 동작 안함.
        const mimeType = "audio/webm";
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        // 녹음 시작될 때 실행
        mediaRecorder.onstart = () => {
          onStartRecord();
        };
        // 녹음 중일 때 데이터 처리.
        mediaRecorder.ondataavailable = (event) => {
          chunksRef.current.push(event.data);
        };
        // 녹음 종료될 때 실행.
        mediaRecorder.onstop = () => {
          // blob 객체를 가져와서 url을 뽑아내는 작업.
          const blob = new Blob(chunksRef.current, {
            type: chunksRef.current[0].type,
          });
          // 다음 녹음을 위해 청크 어레이는 비워줌.
          chunksRef.current = [];
          const url = URL.createObjectURL(blob);
          onStopRecord({ url, extension: "webm" });
          // 오디오를 다 가져와서 멈춰줘야 브라우저 녹음 상태가 종료됨.
          stream.getAudioTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
      });
  }, [hasReactNativeWebview, onStartRecord, onStopRecord, postMessageToRN]);

  const stop = useCallback(() => {
    if (hasReactNativeWebview) {
      postMessageToRN({ type: "stop-record" });
      return;
    }
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
  }, [hasReactNativeWebview, postMessageToRN]);

  const pause = useCallback(() => {
    if (hasReactNativeWebview) {
      postMessageToRN({ type: "pause-record" });
      return;
    }
    if (mediaRecorderRef.current) mediaRecorderRef.current.pause();
  }, [hasReactNativeWebview, postMessageToRN]);

  const resume = useCallback(() => {
    if (hasReactNativeWebview) {
      postMessageToRN({ type: "resume-record" });
      return;
    }
    if (mediaRecorderRef.current) mediaRecorderRef.current.resume();
  }, [hasReactNativeWebview, postMessageToRN]);

  const onPressRecord = useCallback(() => {
    record();
  }, [record]);

  const onPressSave = useCallback(() => {
    stop();
  }, [stop]);

  const onPressPause = useCallback(() => {
    if (state === "recording") {
      pause();
      onPauseRecord();
    } else if (state === "paused") {
      resume();
      onResumeRecord();
    }
  }, [onPauseRecord, onResumeRecord, pause, resume, state]);

  const onPressCamera = useCallback(() => {
    postMessageToRN({ type: "open-camera" });
  }, [postMessageToRN]);

  useEffect(() => {
    if (toastVisible) {
      const id = setTimeout(() => {
        setToastVisible(false);
      }, 2000);
      return () => clearTimeout(id);
    }
  }, [toastVisible]);

  return (
    <div className="h-dvh bg-white flex flex-col">
      <Header
        title="녹음하기"
        renderRight={() => {
          if (!hasReactNativeWebview) return <></>;
          return (
            <button className="mr-[16px]" onClick={onPressCamera}>
              <span className="material-icons text-[#8E8E93] text-[30px]">
                photo_camera
              </span>
            </button>
          );
        }}
      />
      <div className="flex flex-1 flex-col items-center pt-[211px]">
        {state === "recording" && (
          <button
            className="size-[120px] rounded-[80px] bg-[#1A1A1A]"
            onClick={onPressPause}
          >
            <span className="material-icons text-[70px] text-white">mic</span>
          </button>
        )}
        {state === "paused" && (
          <button
            className="size-[120px] rounded-[80px] bg-[#1A1A1A]"
            onClick={onPressPause}
          >
            <span className="material-icons text-[70px] text-white">pause</span>
          </button>
        )}
        {state ?? (
          <button
            className="size-[120px] rounded-[80px] bg-[#1A1A1A]"
            onClick={onPressRecord}
          >
            <span className="material-icons text-[70px] text-[#09CC7F]">
              mic
            </span>
          </button>
        )}
        <p
          className={`text-[20px] font-semibold ${
            state === "recording" || state === "paused"
              ? "text-[#303030]"
              : "text-[#AEAEB2]"
          } mt-[42px]`}
        >
          {formatTime(time)}
        </p>
        {state === "recording" && (
          <button
            className="mt-[42px] bg-[#1A1A1A] rounded-[27px] py-[16px] px-[42px] flex items-center"
            onClick={onPressPause}
          >
            <span className="material-icons text-[20px] text-white">pause</span>
            <span className="text-[15px] text-white ml-[4px] font-semibold">
              일시정지
            </span>
          </button>
        )}
        {(state === "recording" || state === "paused") && (
          <button
            className={`${
              state === "paused" ? "mt-[42px]" : "mt-[16px]"
            } bg-[#09CC7F] rounded-[27px] py-[16px] px-[42px] flex items-center`}
            onClick={onPressSave}
          >
            <span className="material-icons text-[20px] text-white">check</span>
            <span className="text-[15px] text-white ml-[4px] font-semibold">
              저장하기
            </span>
          </button>
        )}
        {toastVisible && (
          <div className="absolute bottom-[21px] flex border-[1.5px] border-[#09CC7F] w-[358px] py-[13px] px-[17px] rounded-[6px] bg-[#F9FEFF]">
            <span className="material-icons text-[24px] text-[#00DDA8]">
              check
            </span>
            <p className="ml-[7px] text-[15px] font-semibold">
              저장이 완료되었습니다.
            </p>
          </div>
        )}
        {audioUrl != null && (
          <audio controls>
            <source src={audioUrl} type="audio/webm" />
          </audio>
        )}
      </div>
    </div>
  );
};

export default RecorderPage;
