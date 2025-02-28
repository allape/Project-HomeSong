import { useEffect, useState } from "react";

export default function useSafeHeight(top: number): number {
  const [y, setY] = useState<number>(0);

  useEffect(() => {
    const handleResize = () => {
      setY(window.innerHeight - top);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [top]);

  return y;
}
