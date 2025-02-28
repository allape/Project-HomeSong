import {
  MouseEvent as RME,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type X = number;
export type Y = number;
export type OnMouseDown = (e: RME<HTMLElement>) => void;
export type OnMouseUp = () => void;

export type Dragger = {
  x: X;
  y: Y;
  onMouseDown: OnMouseDown;
};

export interface IOptions {
  x?: X;
  y?: Y;
  xOffset?: X;
  yOffset?: Y;
}

export default function useDragger(
  { x: xFP, y: yFP, xOffset, yOffset }: IOptions = {
    x: 0,
    y: 0,
    xOffset: 0,
    yOffset: 0,
  },
): Dragger {
  const xRef = useRef<X>(0);
  const yRef = useRef<Y>(0);
  const isDraggingRef = useRef(false);

  const [x, setX] = useState<X>(() => xFP || 0);
  const [y, setY] = useState<Y>(() => yFP || 0);

  const onMouseDown: OnMouseDown = useCallback((e) => {
    isDraggingRef.current = true;
    xRef.current = e.clientX;
    yRef.current = e.clientY;
  }, []);

  useEffect(() => {
    const xo = xOffset || 0;
    const yo = yOffset || 0;

    const handleResize = () => {
      setX((x) => {
        let maxX = window.innerWidth + xo;
        maxX = maxX < 0 ? 0 : maxX;
        if (x > maxX) {
          return maxX;
        }
        return x;
      });
      setY((y) => {
        let maxY = window.innerHeight + yo;
        maxY = maxY < 0 ? 0 : maxY;
        if (y > maxY) {
          return maxY;
        }
        return y;
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const xDelta = e.clientX - xRef.current;
        const yDelta = e.clientY - yRef.current;
        xRef.current = e.clientX;
        yRef.current = e.clientY;
        setX((x) => {
          const newX = x + xDelta;
          if (newX < 0 || newX > window.innerWidth + xo) {
            return x;
          }
          return newX;
        });
        setY((y) => {
          const newY = y + yDelta;
          if (newY < 0 || newY > window.innerHeight + yo) {
            return y;
          }
          return newY;
        });
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleResize);
    };
  }, [xOffset, yOffset]);

  return {
    x,
    y,
    onMouseDown,
  };
}
