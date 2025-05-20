import { useRouter } from "next/router";
import { useCallback } from "react";

const HomePage = () => {
  const router = useRouter();

  const onClickRecord = useCallback(() => {
    router.push("/recorder");
  }, [router]);

  return (
    <div className="h-dvh bg-[#F6F6F9] relative">
      <button
        onClick={onClickRecord}
        className="rounded-[25px] bg-black py-[10px] px-[18px] flex items-center absolute bottom-[29px] right-[16px]"
      >
        <span className="material-icons text-white text-[24px]">mic</span>
        <span className="text-white text-[14px] ml-[3px]">녹음하기</span>
      </button>
    </div>
  );
};

export default HomePage;
