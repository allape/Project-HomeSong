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
  xOffset?: X;
  yOffset?: Y;
}

export default function useDragger(
  { xOffset, yOffset }: IOptions = {
    xOffset: 0,
    yOffset: 0,
  },
): Dragger {
  const xRef = useRef<X>(0);
  const yRef = useRef<Y>(0);
  const isDraggingRef = useRef(false);

  const [x, setX] = useState<X>(0);
  const [y, setY] = useState<Y>(0);

  const onMouseDown: OnMouseDown = useCallback((e) => {
    isDraggingRef.current = true;
    xRef.current = e.clientX;
    yRef.current = e.clientY;
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const xDelta = e.clientX - xRef.current;
        const yDelta = e.clientY - yRef.current;
        xRef.current = e.clientX;
        yRef.current = e.clientY;
        setX((x) => {
          const newX = x + xDelta;
          if (newX < 0 || newX > window.innerWidth + (xOffset || 0)) {
            return x;
          }
          return newX;
        });
        setY((y) => {
          const newY = y + yDelta;
          if (newY < 0 || newY > window.innerHeight + (yOffset || 0)) {
            return y;
          }
          return newY;
        });
      }
    },
    [xOffset, yOffset],
  );

  const onMouseUp: OnMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return {
    x,
    y,
    onMouseDown,
  };
}
