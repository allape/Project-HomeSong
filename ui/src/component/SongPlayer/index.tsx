import { BaseSearchParams } from "@allape/gocrud";
import { config, Flex, useMobile } from "@allape/gocrud-react";
import { TimePoint, useRAFAudioTime } from "@allape/lyrics";
import { useLoading, useProxy } from "@allape/use-loading";
import {
  CloseOutlined,
  DragOutlined,
  ExpandAltOutlined,
  PauseCircleFilled,
  PictureOutlined,
  PlayCircleOutlined,
  ShrinkOutlined,
  StepForwardOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Card, Input, List, Select } from "antd";
import cls from "classnames";
import {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  fillSongsWithCollections,
  ISongWithCollections,
  SongCrudy,
} from "../../api/song.ts";
import useDragger from "../../hook/useDragger.tsx";
import { ICollection } from "../../model/collection.ts";
import { ISongSearchParams } from "../../model/song.ts";
import CollectionSelector, {
  ICollectionSelectorProps,
} from "../CollectionSelector";
import useBitRates, { BitRate } from "./BitRate/useBitRates.tsx";
import Controller, { LoopType } from "./Controller";
import Karaoke from "./Karaoke";
import { IModifiedSong } from "./model.ts";
import Player from "./Player";
import PlayerEventEmitter from "./Player/eventemitter.ts";
import styles from "./style.module.scss";

export interface ISongPlayerProps {
  song?: ISongWithCollections;
  onClose?: () => void;
}

function modifySong(s: ISongWithCollections): IModifiedSong {
  return {
    ...s,
    _url: s.mime
      ? `${config.SERVER_STATIC_URL}${s.filename}`
      : `${config.SERVER_URL}/song/hotwire/${s.id}`,
    _cover: s.cover ? `${config.SERVER_STATIC_URL}${s.cover}` : undefined,
    _name: `${s._singerNames ? `${s._singerNames} - ` : ""}${s.name}`,
  };
}

export default function SongPlayer({
  song: songFromProps,
  onClose,
}: ISongPlayerProps): ReactElement {
  const renderSongsTimerRef = useRef<number>(-1);

  useEffect(() => {
    return () => {
      clearTimeout(renderSongsTimerRef.current);
    };
  }, []);

  const { t } = useTranslation();

  const { loading, execute } = useLoading();

  const { x, y, OnDraggerStart } = useDragger(
    useCallback(
      () => ({
        x: window.innerWidth - 800,
        y: 10,
        xOffset: -500,
        yOffset: -200,
      }),
      [],
    ),
  );

  const isMobile = useMobile();

  const PEE = useMemo(() => new PlayerEventEmitter(), []);

  const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null);

  const [view, setView] = useState<"lyrics" | "list">("list");
  const [layout, setLayout] = useState<"collapsed" | "normal" | "fullscreen">(
    "normal",
  );

  const [collection, collectionRef, setCollection] = useProxy<
    ICollection["id"] | undefined
  >(undefined);

  const [keyword, keywordRef, setKeyword] = useProxy<string>("");
  const [songs, songsRef, setSongs] = useProxy<IModifiedSong[]>([]);
  const [renderingSongs, setRenderingSongs] = useState<IModifiedSong[]>([]);

  const history = useRef<IModifiedSong[]>([]);

  const renderSongs = useCallback(() => {
    clearTimeout(renderSongsTimerRef.current);

    renderSongsTimerRef.current = setTimeout(() => {
      if (!keywordRef.current) {
        setRenderingSongs(songsRef.current);
      }

      setRenderingSongs(
        songsRef.current.filter((s) =>
          s._name.toLowerCase().includes(keywordRef.current.toLowerCase()),
        ),
      );
    }, 300) as unknown as number;
  }, [keywordRef, songsRef]);

  useEffect(() => {
    renderSongs();
  }, [songs, keyword, renderSongs]);

  const [song, songRef, setSong] = useProxy<IModifiedSong | undefined>(
    undefined,
  );

  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const [current] = useRAFAudioTime(audio);
  const [duration, setDuration] = useState<number>(0);
  const [playing, playingRef, setPlaying] = useProxy<boolean>(false);
  const [loop, loopRef, setLoop] = useProxy<LoopType>("shuffle");

  const bitRates = useBitRates();
  const [bitRate, , setBitRate] = useProxy<BitRate>(bitRates[0].value);

  const handleAudioOk = useCallback(
    (audio: HTMLAudioElement | null) => {
      setAudio(audio);
    },
    [setAudio],
  );

  useEffect(() => {
    if (isMobile) {
      setLayout("fullscreen");
    }
  }, [isMobile]);

  useEffect(() => {
    // FIXME: use touch event to avoid iOS devices
    if (document.ontouchstart === null) {
      return;
    }
    if (layout === "fullscreen") {
      document.body.requestFullscreen().then();
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().then();
      }
    }
  }, [layout]);

  const scrollToCurrentSong = useCallback(() => {
    document
      .querySelector(`[data-id=song-${songRef.current?.id}]`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }, [songRef]);

  const handleGetList = useCallback(async () => {
    await execute(async () => {
      if (!collectionRef.current) {
        setSongs([]);
        return;
      }

      const songs = await SongCrudy.all<ISongSearchParams>({
        ...BaseSearchParams,
        in_collectionId: [collectionRef.current],
        orderBy_updatedAt: "desc",
        orderBy_index: "asc",
      });

      const swcs = await fillSongsWithCollections(songs);

      setSongs(swcs.map<IModifiedSong>(modifySong));
    });
  }, [collectionRef, execute, setSongs]);

  useEffect(() => {
    if (!song) {
      return;
    }

    scrollToCurrentSong();

    const index = history.current.findIndex((i) => i.id === song.id);
    if (index > -1) {
      history.current.splice(index, 1);
    }
    history.current.push(song);
  }, [scrollToCurrentSong, song]);

  useEffect(() => {
    if (!songFromProps) {
      return;
    }

    const found = songsRef.current.find((s) => s.id === songFromProps.id);
    if (found) {
      setSong(found);
      return;
    }

    const song = modifySong(songFromProps);
    setSong(song);
    setSongs((songs) => {
      return [song, ...songs];
    });
  }, [setSong, setSongs, songFromProps, songsRef]);

  const handleCollectionChange = useCallback(
    async (id?: ICollection["id"]) => {
      setCollection(id);
      await handleGetList();
    },
    [handleGetList, setCollection],
  );

  const handleChangeSong = useCallback(
    (delta: number) => {
      switch (loopRef.current) {
        case "shuffle":
          if (delta < 0 && history.current.length > 1) {
            history.current.splice(history.current.length - 1, 1);
            const next = history.current[history.current.length - 1];
            setSong(songsRef.current.find((s) => s.id === next.id));
            return;
          }

          setSong((old) => {
            const index = (songsRef.current.length * Math.random()) >> 0;
            let next = songsRef.current[index];
            if (next === old) {
              next = songsRef.current[(index + 1) % songsRef.current.length];
            }
            return next;
          });
          return;
        case "no":
          return;
        case "list":
        default: {
          if (!songRef.current) {
            setSong(songsRef.current[0]);
            return;
          }

          const current = songsRef.current.findIndex(
            (s) => s.id === songRef.current!.id,
          );
          if (current === -1) {
            setSong(songsRef.current[0]);
          }

          const next = current + delta;
          if (next < 0) {
            setSong(songsRef.current[songsRef.current.length - 1]);
          } else if (next >= songsRef.current.length) {
            setSong(songsRef.current[0]);
          } else {
            setSong(songsRef.current[next]);
          }
        }
      }
    },
    [loopRef, setSong, songRef, songsRef],
  );

  const handlePrev = useCallback(() => {
    handleChangeSong(-1);
  }, [handleChangeSong]);

  const handleNext = useCallback(() => {
    handleChangeSong(1);
  }, [handleChangeSong]);

  const handleLoopChange = useCallback(
    (lt: LoopType) => {
      setLoop(lt);
      if (!playingRef.current) {
        handleNext();
      }
    },
    [handleNext, playingRef, setLoop],
  );

  const seekTo = useCallback(
    (c: TimePoint) => {
      PEE.dispatchEvent("seekTo", c / 1000);
    },
    [PEE],
  );

  const loadedRef = useRef(false);

  const handleCollectionsLoaded = useCallback<
    Exclude<ICollectionSelectorProps["onLoaded"], undefined>
  >(
    (records: ICollection[]) => {
      if (loadedRef.current) {
        return;
      }

      loadedRef.current = true;

      handleCollectionChange(records[0]?.id).then();
    },
    [handleCollectionChange],
  );

  useEffect(() => {
    if (songRef.current && view === "list") {
      scrollToCurrentSong();
    }
  }, [scrollToCurrentSong, songRef, view]);

  useEffect(() => {
    if (layout === "collapsed" || !wrapper) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) {
        return;
      }

      let touched = false;
      switch (e.key) {
        case " ":
          touched = true;
          if (playingRef.current) {
            PEE.dispatchEvent("pause");
          } else {
            PEE.dispatchEvent("play");
          }
          break;
        case "ArrowRight":
          touched = true;
          if (e.ctrlKey || e.metaKey) {
            handleNext();
          } else {
            PEE.dispatchEvent("seek", 5);
          }
          break;
        case "ArrowLeft":
          touched = true;
          if (e.ctrlKey || e.metaKey) {
            handlePrev();
          } else {
            PEE.dispatchEvent("seek", -5);
          }
          break;
      }

      if (touched) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    wrapper.addEventListener("keydown", handleKeyDown);
    return () => {
      wrapper.removeEventListener("keydown", handleKeyDown);
    };
  }, [PEE, handleNext, handlePrev, layout, playingRef, wrapper]);

  const isKaraokeMode = view === "lyrics";

  return (
    <Card
      tabIndex={0}
      autoFocus
      ref={setWrapper}
      className={cls(
        styles.wrapper,
        styles[layout],
        isMobile && styles.isMobile,
      )}
      style={{ left: `${x}px`, top: `${y}px` }}
      title={
        <Flex
          className={styles.title}
          justifyContent="flex-start"
          alignItems="center"
        >
          <span
            title={song ? song._name : t("player.name")}
            className={styles.name}
            onClick={scrollToCurrentSong}
          >
            {song ? song._name : t("player.name")}
            {layout === "collapsed" && playing && !isMobile && (
              <MiniProgressBar current={current / 1000} duration={duration} />
            )}
          </span>
          {song && (
            <MiniControls
              playing={playing}
              collapsed={layout === "collapsed"}
              onToggle={() => PEE.dispatchEvent(playing ? "pause" : "play")}
              onNext={handleNext}
            />
          )}
        </Flex>
      }
      extra={
        <>
          {layout !== "collapsed" && (
            <Button
              title={t("player.collapse")}
              className={isMobile ? styles.windowed : undefined}
              type="link"
              onClick={() =>
                setLayout((l) => (l === "fullscreen" ? "normal" : "collapsed"))
              }
            >
              <ShrinkOutlined />
            </Button>
          )}
          {layout !== "fullscreen" && (
            <Button
              title={t("player.expand")}
              className={isMobile ? styles.windowed : undefined}
              type="link"
              onClick={() =>
                setLayout((l) => (l === "collapsed" ? "normal" : "fullscreen"))
              }
            >
              <ExpandAltOutlined />
            </Button>
          )}
          <Button
            title={t("player.move")}
            className={styles.windowed}
            type="link"
            onMouseDown={OnDraggerStart}
            onTouchStart={OnDraggerStart}
          >
            <DragOutlined />
          </Button>
          {(isMobile || layout !== "fullscreen") && (
            <Button
              title={t("player.close")}
              type="link"
              danger
              onClick={onClose}
            >
              <CloseOutlined />
            </Button>
          )}
        </>
      }
    >
      <div
        className={cls(styles.bg, song?._cover && styles.hasCover)}
        style={{
          backgroundImage: song?._cover ? `url(${song?._cover})` : undefined,
        }}
      ></div>
      <div className={styles.container}>
        <div className={styles.player}>
          <div className={cls(styles.header, isKaraokeMode && styles.karaoke)}>
            <div className={styles.form}>
              <div className={styles.row}>
                <div className={styles.collectionSelector}>
                  <CollectionSelector
                    loading={loading}
                    value={collection}
                    onChange={handleCollectionChange}
                    allowClear
                    onLoaded={handleCollectionsLoaded}
                  ></CollectionSelector>
                </div>
                <Select
                  className={styles.bitRateSelector}
                  placeholder={t("player.bitRate._")}
                  options={bitRates}
                  value={bitRate}
                  onChange={setBitRate}
                />
              </div>
              <Input
                placeholder={t("player.search")}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                allowClear
              />
            </div>
            <Player
              song={song}
              bitRate={bitRate}
              emitter={PEE}
              onChange={setPlaying}
              onNext={handleNext}
              onPrev={handlePrev}
              onDurationChange={setDuration}
              onAudioOk={handleAudioOk}
            />
            <Controller
              view={view}
              onViewChange={setView}
              loop={loop}
              onLoopChange={handleLoopChange}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          </div>
          <div className={styles.body}>
            {view === "list" && (
              <SongList song={song} songs={renderingSongs} onChange={setSong} />
            )}
            {isKaraokeMode && (
              <Karaoke
                current={current}
                fullscreen={layout === "fullscreen"}
                song={song}
                onChange={seekTo}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface ISongListProps {
  song?: IModifiedSong;
  songs: IModifiedSong[];
  onChange?: (song: IModifiedSong) => void;
}

function SongList({ song, songs, onChange }: ISongListProps): ReactElement {
  return (
    <div className={styles.list}>
      <List<IModifiedSong>
        itemLayout="horizontal"
        size="small"
        dataSource={songs}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            data-id={`song-${item.id}`}
            onClick={() => onChange?.(item)}
            className={cls(styles.song, song?.id === item.id && styles.playing)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  className={styles.avatar}
                  size={64}
                  shape="square"
                  src={
                    item._cover ? (
                      <img src={item._cover} alt={item._name} loading="lazy" />
                    ) : undefined
                  }
                  icon={item._cover ? undefined : <PictureOutlined />}
                />
              }
              title={<div className={styles.name}>{item._name}</div>}
              description={
                <span className={styles.description}>
                  {item._nonSingerNames ? `+ ${item._nonSingerNames}` : ""}
                </span>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}

interface IMiniControlsProps {
  playing: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onNext: () => void;
}

function MiniControls({
  playing,
  collapsed,
  onToggle,
  onNext,
}: IMiniControlsProps): ReactElement {
  const { t } = useTranslation();
  return collapsed ? (
    <>
      <Button
        title={playing ? t("player.pause") : t("player.prev")}
        className={cls(styles.button)}
        type="link"
        danger={playing}
        onClick={onToggle}
      >
        {playing ? <PauseCircleFilled /> : <PlayCircleOutlined />}
      </Button>
      <Button
        title={t("player.next")}
        className={cls(styles.button)}
        type="link"
        onClick={onNext}
      >
        <StepForwardOutlined />
      </Button>
    </>
  ) : (
    <></>
  );
}

interface IMiniProgressBarProps {
  duration?: number;
  current?: number;
}

function MiniProgressBar({
  duration = 0,
  current = 0,
}: IMiniProgressBarProps): ReactElement {
  return (
    <div className={styles.progress}>
      <div
        className={styles.bar}
        style={{ width: `${(current / duration) * 100}%` }}
      ></div>
    </div>
  );
}
