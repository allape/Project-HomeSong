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
  capitalize?: boolean;
  onChange?: (value?: string) => void;
  onTagCtrlClick?: (value: string) => void;
}

export default function WordInput({
  value,
  splitter,
  capitalize = true,
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

    let values = value
      .split(splitter || /[-|,.、/&]+/)
      .map((i) => i.trim())
      .filter((i) => !!i);

    if (capitalize) {
      values = values.map((i) => {
        return i
          .split(" ")
          .map((i) => i.charAt(0).toUpperCase() + i.slice(1))
          .join(" ");
      });
    }

    setWords((old) => {
      const words: string[] = Array.from(new Set([...values, ...old]));
      if (words.length > 10) {
        return words.slice(0, 10);
      }
      return words;
    });
  }, [capitalize, splitter, value]);

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
