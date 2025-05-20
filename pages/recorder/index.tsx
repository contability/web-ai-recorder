import Header from "@/components/header";
import { useState } from "react";

const RecorderPage = () => {
  const [state, setState] = useState<"recording" | "paused" | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  return (
    <div className="h-dvh bg-white flex flex-col">
      <Header title="녹음하기" />
      <div className="flex flex-1 flex-col items-center pt-[211px]">
        {state === "recording" && (
          <button className="size-[120px] rounded-[80px] bg-[#1A1A1A]">
            <span className="material-icons text-[70px] text-white">mic</span>
          </button>
        )}
        {state === "paused" && (
          <button className="size-[120px] rounded-[80px] bg-[#1A1A1A]">
            <span className="material-icons text-[70px] text-white">pause</span>
          </button>
        )}
        {state ?? (
          <button className="size-[120px] rounded-[80px] bg-[#1A1A1A]">
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
          00:00
        </p>
        {state === "recording" && (
          <button className="mt-[42px] bg-[#1A1A1A] rounded-[27px] py-[16px] px-[42px] flex items-center">
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
      </div>
    </div>
  );
};

export default RecorderPage;
