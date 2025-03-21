import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 컴포넌트가 마운트되면 표시 애니메이션을 시작합니다.
    setShow(true);

    // 3초 후에 토스트를 사라지기 시작하게 설정합니다.
    const hideTimeout = setTimeout(() => {
      setIsExiting(true); // 애니메이션 시작
    }, 3000);

    // 애니메이션이 끝난 후에 onClose 호출
    const onCloseTimeout = setTimeout(() => {
      if (isExiting) {
        onClose();
      }
    }, 3500); // 애니메이션이 끝난 후 추가로 0.5초 후 호출

    return () => {
      clearTimeout(hideTimeout);
      clearTimeout(onCloseTimeout);
    };
  }, [isExiting, onClose]);

  return (
    <div
      className={`transform transition-all duration-500 ease-in-out ${show ? (isExiting ? "-translate-y-10 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100") : "translate-y-5 scale-95 opacity-0"} bg-gray-500 mb-2 flex justify-center items-center gap-2 rounded-xl border border-solid py-3.5 px-8 mb:px-3 mb:py-2`}>
      {type === "success" ? (
        <img src="/icon/check.svg" alt="성공" width={30} />
      ) : (
        <img src="/icon/error.svg" alt="실패" width={30} />
      )}
      <p className="text-[19px] font-medium text-[#fff]  mb:text-[10px]">{message}</p>
    </div>
  );
};

export default Toast;
