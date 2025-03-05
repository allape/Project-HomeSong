import { useLoading } from "@allape/use-loading";
import { LoadingOutlined } from "@ant-design/icons";
import { Empty } from "antd";
import cls from "classnames";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLyrics0 } from "../../../api/song.ts";
import Lyrics from "../../../helper/lyrics.ts";
import { ILyrics } from "../../../model/lyrics.ts";
import { ISong } from "../../../model/song.ts";
import styles from "./style.module.scss";

export interface IKaraokeProps {
  current: number;
  song?: ISong;
  onChange?: (tp: number) => void;
}

export default function Karaoke({
  current,
  song,
  onChange,
}: IKaraokeProps): ReactElement {
  const { t } = useTranslation();

  const { loading, execute } = useLoading();

  const lastInteractTime = useRef<number>(0);
  const lastScrollIntoTime = useRef<number>(0);

  const lyricsRef = useRef<ILyrics | null>(null);

  const [index, setIndex] = useState<number>(-1);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [lyrics, setLyrics] = useState<Lyrics | undefined>(undefined);

  useEffect(() => {
    lyricsRef.current = null;
    setLyrics(undefined);

    if (!song) {
      return;
    }

    execute(async () => {
      const l = await getLyrics0(song.id);
      if (!l) {
        return;
      }

      lyricsRef.current = l;

      setLyrics(Lyrics.parse(l.content));
    }).then();
  }, [execute, song]);

  useEffect(() => {
    if (!lyrics || !container) {
      return;
    }

    const index = lyrics.getLineIndexByTimePoint(
      current * 1000 + (lyricsRef.current?.offset || 0),
    );
    if (index === -1) {
      return;
    }

    setIndex(index);

    if (
      performance.now() - lastInteractTime.current > 1000 &&
      performance.now() - lastScrollIntoTime.current > 200
    ) {
      const line = container.querySelector(`[data-lyrics=index-${index}]`);
      if (line) {
        line.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
        lastScrollIntoTime.current = performance.now();
      }
    }
  }, [container, current, lyrics]);

  const handleInteracted = useCallback(() => {
    lastInteractTime.current = performance.now();
  }, []);

  return (
    <div
      ref={setContainer}
      className={styles.wrapper}
      onWheel={handleInteracted}
      onTouchStart={handleInteracted}
      onTouchEnd={handleInteracted}
    >
      <div className={styles.placeholder}></div>
      {loading && (
        <div className={styles.loadingText}>
          <LoadingOutlined /> {t("player.loadingLyrics")}
        </div>
      )}
      <div className={styles.lines}>
        {!loading && !lyrics?.lines?.length ? (
          <Empty description={t("player.noLyrics")} />
        ) : undefined}
        {lyrics?.lines.map((l, i) => (
          <div
            key={i}
            className={cls(styles.line, index === i && styles.current)}
            data-lyrics={`index-${i}`}
            onClick={() => onChange?.(l[0] / 1000)}
          >
            {l[2].map((i) => i[2]).join("")}
          </div>
        ))}
      </div>
      <div className={styles.placeholder}></div>
    </div>
  );
}
