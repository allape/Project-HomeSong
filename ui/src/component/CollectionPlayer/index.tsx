import { config, Flex, useMobile } from "@allape/gocrud-react";
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
import { Avatar, Button, Card, List } from "antd";
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
  CollectionSongCrudy,
  getRandomSongInCollection,
} from "../../api/collection.ts";
import {
  fillSongsWithCollections,
  ISongWithCollections,
  SongCrudy,
} from "../../api/song.ts";
import useDragger from "../../hook/useDragger.tsx";
import {
  ICollection,
  ICollectionSongSearchParams,
} from "../../model/collection.ts";
import { ISong, ISongSearchParams } from "../../model/song.ts";
import CollectionSelector from "../CollectionSelector";
import { IModifiedSong } from "./model.ts";
import SongPlayer from "./SongPlayer";
import SongPlayEventEmitter from "./SongPlayer/eventemitter.ts";
import styles from "./style.module.scss";

type PageNumber = number;

export interface ICollectionPlayerProps {
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
    _name: `${s._artistName ? `${s._artistName} - ` : ""}${s.name}`,
  };
}

export default function CollectionPlayer({
  song: songFromProps,
  onClose,
}: ICollectionPlayerProps): ReactElement {
  const { t } = useTranslation();

  const { loading, execute } = useLoading();

  const { x, y, onMouseDown } = useDragger(
    useCallback(
      () => ({
        x: window.innerWidth - 800,
        y: 0,
        xOffset: -500,
        yOffset: -200,
      }),
      [],
    ),
  );

  const isMobile = useMobile();

  const PlayerEventEmitter = useMemo(() => new SongPlayEventEmitter(), []);

  const scrolledContentRef = useRef<HTMLDivElement | null>(null);
  const collectionSongsRef = useRef<ISong["id"][]>([]);
  const currentRef = useRef<PageNumber>(1);
  const lastScrolledTime = useRef<number>(0);
  const scrollerTimerRef = useRef<number>(-1);

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [shadow, setShadow] = useState<boolean>(false);

  const [collection, collectionRef, setCollection] = useProxy<
    ICollection["id"] | undefined
  >(undefined);
  const [songs, songsRef, setSongs] = useProxy<IModifiedSong[]>([]);

  const [song, songRef, setSong] = useProxy<IModifiedSong | undefined>(
    undefined,
  );

  const [current, setCurrent] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playing, playingRef, setPlaying] = useProxy<boolean>(false);
  const [shuffle, shuffleRef, setShuffle] = useProxy<boolean>(false);

  useEffect(() => {
    return () => {
      clearTimeout(scrollerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      setCollapsed(false);
    }
  }, [isMobile]);

  const checkShadow = useCallback(() => {
    if (scrolledContentRef.current?.parentElement) {
      setShadow(scrolledContentRef.current.parentElement.scrollTop !== 0);
    }
    lastScrolledTime.current = performance.now();
  }, []);

  const scrollToCurrentSong = useCallback(() => {
    document
      .querySelector(`[data-id=song-${songRef.current?.id}]`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    clearTimeout(scrollerTimerRef.current);
    scrollerTimerRef.current = setTimeout(() => {
      checkShadow();
    }, 500) as unknown as number;
  }, [checkShadow, songRef]);

  useEffect(() => {
    if (!song) {
      return;
    }

    if (performance.now() - lastScrolledTime.current < 100) {
      return;
    }

    scrollToCurrentSong();
  }, [scrollToCurrentSong, song]);

  const handleNextPage = useCallback(async () => {
    await execute(async () => {
      const songs = await SongCrudy.page<ISongSearchParams>(
        currentRef.current,
        10000,
        {
          in_id: collectionSongsRef.current,
          orderBy_updatedAt: "desc",
          orderBy_index: "asc",
        },
      );

      const swcs = await fillSongsWithCollections(songs);

      setSongs(swcs.map<IModifiedSong>(modifySong));
    });
  }, [execute, setSongs]);

  useEffect(() => {
    handleNextPage().then();
  }, [handleNextPage]);

  useEffect(() => {
    if (!songFromProps) {
      return;
    }
    const song = modifySong(songFromProps);
    setSong(song);
    setSongs((songs) => {
      if (songs.find((s) => s.id === song.id)) {
        return songs;
      }
      return [song, ...songs];
    });
  }, [setSong, setSongs, songFromProps]);

  const handleChange = useCallback(
    async (id?: ICollection["id"]) => {
      if (!id) {
        collectionSongsRef.current = [];
        setCollection(undefined);
      } else {
        await execute(async () => {
          collectionSongsRef.current = (
            await CollectionSongCrudy.all<ICollectionSongSearchParams>({
              in_collectionId: id ? [id] : undefined,
            })
          ).map((cs) => cs.songId);
          setCollection(id);
        });
      }

      currentRef.current = 1;
      await handleNextPage();
    },
    [execute, handleNextPage, setCollection],
  );

  const handleChangeSong = useCallback(
    (delta: number) => {
      if (shuffleRef.current) {
        execute(async () => {
          const song = await getRandomSongInCollection(
            collectionRef.current || 0,
          );
          let index = songsRef.current.findIndex((s) => s.id === song.id);
          if (songRef.current?.id === song.id) {
            index += 1;
            if (index >= songsRef.current.length) {
              index = 0;
            }
          }
          const nextSong = songsRef.current[index];
          setSong(nextSong);
        }).then();
        return;
      }

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
    },
    [collectionRef, execute, setSong, shuffleRef, songRef, songsRef],
  );

  const handlePrev = useCallback(() => {
    handleChangeSong(-1);
  }, [handleChangeSong]);

  const handleNext = useCallback(() => {
    handleChangeSong(1);
  }, [handleChangeSong]);

  const handleShuffle = useCallback(() => {
    setShuffle((v) => !v);
    if (!playingRef.current) {
      handleNext();
    }
  }, [handleNext, playingRef, setShuffle]);

  return (
    <Card
      className={cls(styles.wrapper, collapsed && styles.collapsed)}
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
            {collapsed && playing && (
              <MiniProgressBar current={current} duration={duration} />
            )}
          </span>
          {song && (
            <MiniControls
              playing={playing}
              collapsed={collapsed}
              onToggle={() =>
                PlayerEventEmitter.dispatchEvent(playing ? "pause" : "play")
              }
              onNext={handleNext}
            />
          )}
        </Flex>
      }
      extra={
        <>
          <Button
            title={t("player.close")}
            type="link"
            danger
            onClick={onClose}
          >
            <CloseOutlined />
          </Button>
          {collapsed ? (
            <Button
              title={t("player.expand")}
              className={styles.windowed}
              type="link"
              onClick={() => setCollapsed(false)}
            >
              <ExpandAltOutlined />
            </Button>
          ) : (
            <Button
              title={t("player.collapse")}
              className={styles.windowed}
              type="link"
              onClick={() => setCollapsed(true)}
            >
              <ShrinkOutlined />
            </Button>
          )}
          <Button
            title={t("player.move")}
            className={styles.windowed}
            type="link"
            onMouseDown={onMouseDown}
          >
            <DragOutlined />
          </Button>
        </>
      }
    >
      <div
        ref={scrolledContentRef}
        className={styles.player}
        onWheel={checkShadow}
      >
        <div className={styles.header}>
          <CollectionSelector
            loading={loading}
            value={collection}
            onChange={handleChange}
            allowClear
          ></CollectionSelector>
          <SongPlayer
            shadow={shadow}
            shuffle={shuffle}
            song={song}
            emitter={PlayerEventEmitter}
            onChange={setPlaying}
            onNext={handleNext}
            onPrev={handlePrev}
            onShuffle={handleShuffle}
            onCurrentChange={setCurrent}
            onDurationChange={setDuration}
          />
        </div>
        <div className={styles.list}>
          <List<IModifiedSong>
            itemLayout="horizontal"
            size="small"
            dataSource={songs}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                data-id={`song-${item.id}`}
                onClick={() => setSong(item)}
                className={cls(
                  styles.song,
                  song?.id === item.id && styles.playing,
                )}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      className={styles.avatar}
                      size={64}
                      src={item._cover}
                      icon={item._cover ? undefined : <PictureOutlined />}
                    />
                  }
                  title={<div className={styles.name}>{item._name}</div>}
                  description={item._nonartistName || "-"}
                />
              </List.Item>
            )}
          />
        </div>
      </div>
    </Card>
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
  return (
    <>
      <Button
        title={playing ? t("player.pause") : t("player.prev")}
        className={cls(styles.button, collapsed ? undefined : styles.mobile)}
        type="link"
        danger={playing}
        onClick={onToggle}
      >
        {playing ? <PauseCircleFilled /> : <PlayCircleOutlined />}
      </Button>
      <Button
        title={t("player.next")}
        className={cls(styles.button, collapsed ? undefined : styles.mobile)}
        type="link"
        onClick={onNext}
      >
        <StepForwardOutlined />
      </Button>
    </>
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
