import { config, Flex } from "@allape/gocrud-react";
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
import { Avatar, Button, Card, List, Tooltip } from "antd";
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
    _url: `${config.SERVER_STATIC_URL}${s.filename}`,
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

  const { x, y, onMouseDown } = useDragger({
    x: 600,
    y: 6,
    xOffset: -500,
    yOffset: -200,
  });

  const PlayerEventEmitter = useMemo(() => new SongPlayEventEmitter(), []);

  const collectionSongsRef = useRef<ISong["id"][]>([]);
  const currentRef = useRef<PageNumber>(1);

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [atTop, setAtTop] = useState<boolean>(true);

  const [collection, collectionRef, setCollection] = useProxy<
    ICollection["id"] | undefined
  >(undefined);
  const [songs, songsRef, setSongs] = useProxy<IModifiedSong[]>([]);

  const [song, songRef, setSong] = useProxy<IModifiedSong | undefined>(
    undefined,
  );
  const [playing, setPlaying] = useState<boolean>(false);
  const [shuffle, shuffleRef, setShuffle] = useProxy<boolean>(false);

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
        setCollection(undefined);
        setSongs([]);
        return;
      }

      await execute(async () => {
        collectionSongsRef.current = (
          await CollectionSongCrudy.all<ICollectionSongSearchParams>({
            in_collectionId: [id],
          })
        ).map((cs) => cs.songId);
        currentRef.current = 1;
        setCollection(id);
      });

      await handleNextPage();
    },
    [execute, handleNextPage, setCollection, setSongs],
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
  }, [setShuffle]);

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
          {song ? song._name : t("player.name")}
          {song && (
            <Tooltip title={playing ? t("player.pause") : t("player.prev")}>
              <Button
                className={cls(
                  styles.button,
                  collapsed ? undefined : styles.mobile,
                )}
                type="link"
                danger={playing}
                onClick={() =>
                  PlayerEventEmitter.dispatchEvent(playing ? "pause" : "play")
                }
              >
                {playing ? <PauseCircleFilled /> : <PlayCircleOutlined />}
              </Button>
            </Tooltip>
          )}
          {song ? (
            <Tooltip title={t("player.next")}>
              <Button
                className={cls(
                  styles.button,
                  collapsed ? undefined : styles.mobile,
                )}
                type="link"
                onClick={handleNext}
              >
                <StepForwardOutlined />
              </Button>
            </Tooltip>
          ) : undefined}
        </Flex>
      }
      extra={
        <>
          <Tooltip title={t("player.close")}>
            <Button type="link" danger onClick={onClose}>
              <CloseOutlined />
            </Button>
          </Tooltip>
          {collapsed ? (
            <Tooltip title={t("player.expand")}>
              <Button
                className={styles.windowed}
                type="link"
                onClick={() => setCollapsed(false)}
              >
                <ExpandAltOutlined />
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title={t("player.collapse")}>
              <Button
                className={styles.windowed}
                type="link"
                onClick={() => setCollapsed(true)}
              >
                <ShrinkOutlined />
              </Button>
            </Tooltip>
          )}
          <Tooltip title={t("player.move")}>
            <Button
              className={styles.windowed}
              type="link"
              onMouseDown={onMouseDown}
            >
              <DragOutlined />
            </Button>
          </Tooltip>
        </>
      }
    >
      <div
        className={styles.player}
        onWheel={(e) =>
          setAtTop(e.currentTarget.parentElement?.scrollTop === 0)
        }
      >
        <div className={styles.header}>
          <CollectionSelector
            loading={loading}
            value={collection}
            onChange={handleChange}
            allowClear
          ></CollectionSelector>
          <SongPlayer
            shadow={!atTop}
            shuffle={shuffle}
            song={song}
            emitter={PlayerEventEmitter}
            onChange={setPlaying}
            onNext={handleNext}
            onPrev={handlePrev}
            onShuffle={handleShuffle}
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
