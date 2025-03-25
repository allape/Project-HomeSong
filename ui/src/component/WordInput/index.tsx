import { Input, InputProps, Tag } from "antd";
import {
  MouseEvent,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react";

export interface IWordInputProps
  extends Omit<InputProps, "value" | "onChange"> {
  value?: string;
  splitter?: RegExp;
  onChange?: (value?: string) => void;
  onTagCtrlClick?: (value: string) => void;
}

export default function WordInput({
  value,
  splitter = /[-|,.、/&]+/,
  onChange,
  onTagCtrlClick,
  ...props
}: IWordInputProps): ReactElement {
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    if (!value) {
      setWords([]);
      return;
    }

    const values = value
      .split(splitter)
      .map((i) => i.trim())
      .filter((i) => !!i);

    setWords((old) => {
      const words: string[] = Array.from(new Set([...values, ...old]));
      if (words.length > 10) {
        return words.slice(0, 10);
      }
      return words;
    });
  }, [splitter, value]);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLSpanElement>, word: string) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        onTagCtrlClick?.(word);
      } else {
        onChange?.(word);
      }
    },
    [onChange, onTagCtrlClick],
  );

  return (
    <>
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
      <div style={{ paddingTop: "5px" }}>
        {words.map((word) => (
          <Tag
            key={word}
            onClick={(e) => handleClick(e, word)}
            style={{ cursor: "pointer" }}
          >
            {word}
          </Tag>
        ))}
      </div>
    </>
  );
}
