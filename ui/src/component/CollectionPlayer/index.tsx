import { config } from "@allape/gocrud-react";
import { useLoading, useProxy } from "@allape/use-loading";
import {
  CloseOutlined,
  DragOutlined,
  ExpandAltOutlined,
  PictureOutlined,
  ShrinkOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Card, List } from "antd";
import cls from "classnames";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CollectionSongCrudy } from "../../api/collection.ts";
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
    _name: `${
      s._collections?.length
        ? s._collections
            .filter((c) => c.type === "artist")
            .map((c) => c.name)
            .join(", ")
        : ""
    } - ${s.name}`,
  };
}

export default function CollectionPlayer({
  song: songFromProps,
  onClose,
}: ICollectionPlayerProps): ReactElement {
  const { t } = useTranslation();

  const { loading, execute } = useLoading();

  const { x, y, onMouseDown } = useDragger({
    xOffset: -500,
    yOffset: -200,
  });

  const collectionSongsRef = useRef<ISong["id"][]>([]);
  const currentRef = useRef<PageNumber>(1);

  const [collapsed, setCollapsed] = useState<boolean>(false);

  const [collection, setCollection] = useState<ICollection["id"] | undefined>();
  const [songs, songsRef, setSongs] = useProxy<IModifiedSong[]>([]);

  const [song, songRef, setSong] = useProxy<IModifiedSong | undefined>(
    undefined,
  );
  const [playing, setPlaying] = useState<boolean>(false);

  const handleNextPage = useCallback(async () => {
    await execute(async () => {
      const songs = await SongCrudy.page<ISongSearchParams>(
        currentRef.current,
        1000,
        {
          in_id: collectionSongsRef.current,
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
      });

      await handleNextPage();
    },
    [execute, handleNextPage, setSongs],
  );

  const handleChangeSong = useCallback(
    (delta: number) => {
      if (!songRef.current) {
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
    [setSong, songRef, songsRef],
  );

  const handlePrev = useCallback(() => {
    handleChangeSong(-1);
  }, [handleChangeSong]);

  const handleNext = useCallback(() => {
    handleChangeSong(1);
  }, [handleChangeSong]);

  return (
    <Card
      className={cls(styles.wrapper, collapsed && styles.collapsed)}
      style={{ left: `${x}px`, top: `${y}px` }}
      title={playing ? song?._name : t("player.name")}
      extra={
        <>
          <Button type="link" danger onClick={onClose}>
            <CloseOutlined />
          </Button>
          {collapsed ? (
            <Button
              className={styles.windowed}
              type="link"
              onClick={() => setCollapsed(false)}
            >
              <ExpandAltOutlined />
            </Button>
          ) : (
            <Button
              className={styles.windowed}
              type="link"
              onClick={() => setCollapsed(true)}
            >
              <ShrinkOutlined />
            </Button>
          )}
          <Button
            className={styles.windowed}
            type="link"
            onMouseDown={onMouseDown}
          >
            <DragOutlined />
          </Button>
        </>
      }
    >
      <div className={styles.player}>
        <div className={styles.header}>
          <CollectionSelector
            loading={loading}
            value={collection}
            onChange={handleChange}
            allowClear
          ></CollectionSelector>
          <SongPlayer
            song={song}
            onChange={setPlaying}
            onNext={handleNext}
            onPrev={handlePrev}
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
                    item._cover ? (
                      <Avatar
                        className={styles.avatar}
                        size={64}
                        src={item._cover}
                        onClick={() => window.open(item._cover)}
                      />
                    ) : (
                      <Avatar size={64} icon={<PictureOutlined />} />
                    )
                  }
                  title={item._name}
                  description={item.mime || item.description}
                />
              </List.Item>
            )}
          />
        </div>
      </div>
    </Card>
  );
}
