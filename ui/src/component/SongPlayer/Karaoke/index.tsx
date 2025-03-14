import { ILV } from "@allape/gocrud-react";
import { ILyricsProps, Lyrics, TimePoint } from "@allape/lyrics";
import { useLoading, useProxy } from "@allape/use-loading";
import { LoadingOutlined } from "@ant-design/icons";
import { Select } from "antd";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLyrics } from "../../../api/song.ts";
import { ILyrics } from "../../../model/lyrics.ts";
import { ISong } from "../../../model/song.ts";
import styles from "./style.module.scss";

const LyricsStyles: ILyricsProps["styles"] = {
  mask: {
    translate: "0 -1.5px",
  },
};

export interface IKaraokeProps {
  current: TimePoint;
  song?: ISong;
  onChange?: (tp: TimePoint) => void;
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

  return (
    <div className={styles.wrapper}>
      {loading && (
        <div className={styles.loadingText}>
          <LoadingOutlined /> {t("player.loadingLyrics")}
        </div>
      )}
      <Lyrics
        karaoke
        styles={LyricsStyles}
        current={current}
        content={currentLyrics?.content}
        onChange={onChange}
      />
      <Select<ILyrics["id"]>
        loading={loading}
        className={styles.selector}
        value={currentLyrics?.id}
        options={options}
        onChange={handleChange}
        placeholder={t("lyrics._")}
      />
    </div>
  );
}
