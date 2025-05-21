import Header from "@/components/header";
import { formatTime } from "@/modules/util";
import { useCallback, useEffect, useRef, useState } from "react";

const RecorderPage = () => {
  const [state, setState] = useState<"recording" | "paused" | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [time, setTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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

  const onStartRecord = useCallback(() => {
    setTime(0);
    setAudioUrl(null);
    startTimer();
    setState("recording");
  }, [startTimer]);

  // url: 녹음이 저장될 주소
  const onStopRecord = useCallback(
    ({ url }: { url: string }) => {
      setAudioUrl(url);
      setState(null);
      stopTimer();
      showToast();
    },
    [showToast, stopTimer]
  );

  const record = useCallback(() => {
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
        // 녹음 중일 때 데이터 처리
        mediaRecorder.ondataavailable = (event) => {
          chunksRef.current.push(event.data);
        };
        // 녹음 종료될 때 실행
        mediaRecorder.onstop = () => {
          // blob 객체를 가져와서 url을 뽑아내는 작업
          const blob = new Blob(chunksRef.current, {
            type: chunksRef.current[0].type,
          });
          // 다음 녹음을 위해 청크 어레이는 비워줌.
          chunksRef.current = [];
          const url = URL.createObjectURL(blob);
          onStopRecord({ url });
          // 오디오를 다 가져와서 멈춰줘야 브라우저 녹음 상태가 종료됨.
          stream.getAudioTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
      });
  }, [onStartRecord, onStopRecord]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
  }, []);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.pause();
  }, []);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.resume();
  }, []);

  const onPressRecord = useCallback(() => {
    record();
  }, [record]);

  const onPressSave = useCallback(() => {
    stop();
  }, [stop]);

  const onPressPause = useCallback(() => {
    if (state === "recording") {
      pause();
      stopTimer();
      setState("paused");
    } else if (state === "paused") {
      resume();
      startTimer();
      setState("recording");
    }
  }, [pause, resume, startTimer, state, stopTimer]);

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
      <Header title="녹음하기" />
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
