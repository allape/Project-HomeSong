import { ILV } from "@allape/gocrud-react";
import { useLoading, useProxy } from "@allape/use-loading";
import { LoadingOutlined } from "@ant-design/icons";
import { Empty, Select } from "antd";
import cls from "classnames";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLyrics } from "../../../api/song.ts";
import Lyrics from "../../../helper/lyrics.ts";
import { ILyrics } from "../../../model/lyrics.ts";
import { ISong } from "../../../model/song.ts";
import styles from "./style.module.scss";

export interface IKaraokeProps {
  current: number;
  song?: ISong;
  onChange?: (tp: number) => void;
}

export interface IModifiedLyrics extends ILyrics {
  value?: ILyrics["id"];
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

  const [index, setIndex] = useState<number>(-1);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const [lyricsDriver, setLyricsDriver] = useState<Lyrics | null>(null);

  const [currentLyrics, currentLyricsRef, setCurrentLyrics] = useProxy<
    ILyrics | undefined
  >(undefined);

  const allLyrics = useRef<ILyrics[]>([]);
  const [options, setOptions] = useState<ILV<ILyrics["id"]>[]>([]);

  const handleChange = useCallback(
    (id: ILyrics["id"]) => {
      setCurrentLyrics(allLyrics.current.find((i) => i.id === id));
    },
    [setCurrentLyrics],
  );

  useEffect(() => {
    setLyricsDriver(null);
    setCurrentLyrics(undefined);

    if (!song) {
      return;
    }

    execute(async () => {
      const ls: IModifiedLyrics[] = await getLyrics(song.id);

      if (!ls[0]) {
        return;
      }

      allLyrics.current = ls;

      setOptions(
        ls.map((i) => ({ value: i.id, label: `${t("lyrics._")} - ${i.name}` })),
      );
      setCurrentLyrics(ls[0]);
    }).then();
  }, [execute, song, currentLyricsRef, setCurrentLyrics, t]);

  useEffect(() => {
    if (!currentLyrics?.content) {
      setLyricsDriver(null);
      return;
    }
    setLyricsDriver(Lyrics.parse(currentLyrics.content));
  }, [currentLyrics]);

  useEffect(() => {
    if (!lyricsDriver || !container) {
      return;
    }

    const index = lyricsDriver.getLineIndexByTimePoint(
      current * 1000 + (currentLyricsRef.current?.offset || 0),
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
  }, [container, current, currentLyricsRef, lyricsDriver]);

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
        {!loading && !lyricsDriver?.lines?.length ? (
          <Empty description={t("player.noLyrics")} />
        ) : undefined}
        {lyricsDriver?.lines.map((l, i) => (
          <div
            key={i}
            className={cls(styles.line, index === i && styles.current)}
            data-lyrics={`index-${i}`}
            onClick={() =>
              onChange?.(l[0] / 1000 + (currentLyrics?.offset || 0))
            }
          >
            {l[2].map((i) => i[2]).join("")}
          </div>
        ))}
      </div>
      <div className={styles.placeholder}></div>
      <Select<ILyrics["id"]>
        className={styles.selector}
        value={currentLyrics?.id}
        options={options}
        onChange={handleChange}
        placeholder={t("lyrics._")}
      />
    </div>
  );
}
