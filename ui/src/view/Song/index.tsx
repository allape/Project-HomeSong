import { BaseSearchParams } from "@allape/gocrud";
import {
  asDefaultPattern,
  config,
  CrudyTable,
  Ellipsis,
  Flex,
  ICrudyTableProps,
  searchable,
  Uploader,
  useMobile,
} from "@allape/gocrud-react";
import NewCrudyButtonEventEmitter from "@allape/gocrud-react/src/component/CrudyButton/eventemitter.ts";
import {
  CustomerServiceOutlined,
  DownloadOutlined,
  MoreOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Button,
  Divider,
  Dropdown,
  Form,
  FormInstance,
  Input,
  InputNumber,
  MenuProps,
  Switch,
  TableColumnsType,
  Tooltip,
} from "antd";
import cls from "classnames";
import {
  ChangeEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  createOrGetCollectionsByArtistNames,
  saveCollectionSongsBySong,
} from "../../api/collection.ts";
import {
  fillSongsWithCollections,
  getLyrics,
  ISongWithCollections,
  saveLyricsBySong,
  SongCrudy,
  upload,
} from "../../api/song.ts";
import CollectionCrudyButton from "../../component/CollectionCrudyButton";
import CollectionSelector from "../../component/CollectionSelector";
import CopyButton from "../../component/CopyButton";
import LyricsCrudyButton from "../../component/LyricsCrudyButton";
import LyricsSelector from "../../component/LyricsSelector";
import SongPlayer from "../../component/SongPlayer";
import WordInput from "../../component/WordInput";
import { ICollection } from "../../model/collection.ts";
import { ILyrics } from "../../model/lyrics.ts";
import { ISong, ISongSearchParams } from "../../model/song.ts";
import styles from "./style.module.scss";

type ISearchParams = ISongSearchParams;

interface IRecord
  extends Partial<
      Pick<
        ISongWithCollections,
        "_collections" | "_artistName" | "_nonartistName"
      >
    >,
    ISong {
  _continuesUpload?: boolean;
  _keepCover?: boolean;

  _file?: File;
  _collectionIds?: ICollection["id"][];
  _lyricsIds?: ILyrics["id"][];

  _url?: string;
  _cover?: string;
  _name?: string;
}

export default function Song(): ReactElement {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const CollectionCrudyEmitter = useMemo(
    () => NewCrudyButtonEventEmitter<ICollection>(),
    [],
  );
  const LyricsCrudyEmitter = useMemo(
    () => NewCrudyButtonEventEmitter<ILyrics>(),
    [],
  );

  const isMobile = useMobile();

  const fileRef = useRef<File | undefined>();

  const [searchParams, setSearchParams] = useState<ISearchParams>(() => ({
    ...BaseSearchParams,
    orderBy_updatedAt: "desc",
  }));
  const [form, setForm] = useState<FormInstance<IRecord> | undefined>();
  const [playerVisible, setPlayerVisible] = useState<boolean>(false);
  const [songForPlay, setSongForPlay] = useState<
    ISongWithCollections | undefined
  >();

  const columns = useMemo<TableColumnsType<IRecord>>(
    () => [
      {
        title: t("id"),
        width: 100,
        dataIndex: "id",
      },
      {
        title: t("song.cover"),
        dataIndex: "_cover",
        render: (v) => {
          return v ? (
            <Avatar
              className={styles.avatar}
              size={64}
              src={v}
              shape="square"
              onClick={() => window.open(v)}
            />
          ) : (
            <Avatar shape="square" size={64} icon={<PictureOutlined />} />
          );
        },
      },
      {
        title: t("collection._"),
        dataIndex: "_nonartistName",
        ellipsis: { showTitle: true },
        filtered: !!searchParams["collectionId"],
        ...searchable<IRecord, ICollection["id"]>(
          t("song.name"),
          (value) =>
            setSearchParams((old) => ({
              ...old,
              collectionId: value,
            })),
          (value, onChange) => (
            <CollectionSelector value={value} onChange={onChange} />
          ),
        ),
      },
      {
        title: t("song.name"),
        dataIndex: "name",
        ellipsis: { showTitle: true },
        render: (_, record) => (
          <Flex justifyContent="flex-start">
            <CopyButton value={record._name} />
            <Tooltip title={record._name}>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setPlayerVisible(true);
                  setSongForPlay(record as ISongWithCollections);
                }}
              >
                {record._name}
              </Button>
            </Tooltip>
          </Flex>
        ),
        filtered: !!searchParams["like_name"],
        ...searchable(t("song.name"), (value) =>
          setSearchParams((old) => ({
            ...old,
            like_name: value,
          })),
        ),
      },
      {
        title: t("song.mime"),
        dataIndex: "mime",
        align: "center",
        render: (v) => v || "-",
      },
      {
        title: t("song.ffprobeInfo"),
        dataIndex: "ffprobeInfo",
        render: (v) => <Ellipsis>{v}</Ellipsis>,
      },
      {
        title: t("createdAt"),
        dataIndex: "createdAt",
        render: asDefaultPattern,
      },
      {
        title: t("updatedAt"),
        dataIndex: "updatedAt",
        render: asDefaultPattern,
      },
    ],
    [searchParams, t],
  );

  const handleAfterListed = useCallback(
    async (records: IRecord[]): Promise<IRecord[]> => {
      const swcs = await fillSongsWithCollections(records);
      return swcs.map<IRecord>((s) => {
        return {
          ...s,

          _url: s.filename
            ? `${config.SERVER_STATIC_URL}${s.filename}`
            : undefined,
          _cover: s.cover ? `${config.SERVER_STATIC_URL}${s.cover}` : undefined,

          _collectionIds: s._collections.map((c) => c.id),

          _nonartistNames: s._collections
            .filter((c) => c.type !== "artist")
            .map((c) => c.name),

          _name: `${s._artistName ? `${s._artistName} - ` : ""}${s.name}`,
        };
      });
    },
    [],
  );

  const handleSave = useCallback(async (record: IRecord): Promise<IRecord> => {
    const song = await upload(record, fileRef.current);

    fileRef.current = undefined;

    await saveCollectionSongsBySong(song.id, record._collectionIds || []);

    await saveLyricsBySong(song.id, record._lyricsIds || []);

    return song;
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!form) {
        return;
      }

      fileRef.current = e.target.files?.[0];

      if (fileRef.current && !form.getFieldValue("name")) {
        form.setFieldValue("name", fileRef.current.name);
      }
    },
    [form],
  );

  const menus = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "Collection",
        label: t("collection._"),
        onClick: () => {
          CollectionCrudyEmitter.dispatchEvent("open");
        },
      },
      {
        key: "Lyrics",
        label: t("lyrics._"),
        onClick: () => {
          LyricsCrudyEmitter.dispatchEvent("open");
        },
      },
      {
        key: "Player",
        label: t("player.name"),
        onClick: () => {
          setPlayerVisible(true);
        },
      },
    ],
    [CollectionCrudyEmitter, LyricsCrudyEmitter, t],
  );

  const handleBeforeEdit = useCallback<
    Exclude<ICrudyTableProps<IRecord>["beforeEdit"], undefined>
  >(async (record?: IRecord): Promise<IRecord | undefined> => {
    if (!record) {
      return record;
    }

    record._lyricsIds = (await getLyrics(record.id)).map((i) => i.id) || [];
    return record;
  }, []);

  const handleAfterSaved = useCallback<
    Exclude<ICrudyTableProps<IRecord>["afterSaved"], undefined>
  >((_, form): boolean => {
    const value = form.getFieldsValue();

    if (!value._continuesUpload) {
      return true;
    }

    form.resetFields();
    form.setFieldsValue({
      _continuesUpload: true,
      _keepCover: value._keepCover,
      _collectionIds: value._collectionIds,
      description: value.description,
      cover: value._keepCover ? value.cover : undefined,
    });

    return false;
  }, []);

  const actions = useCallback<
    Exclude<ICrudyTableProps<IRecord>["actions"], undefined>
  >(
    ({ record, size }): ReactNode => {
      return (
        <>
          <Button
            data-url={record._url}
            size={size}
            title={t("download")}
            type="link"
            onClick={() => window.open(record._url)}
          >
            <a href={record._url} onClick={(e) => e.preventDefault()}>
              <DownloadOutlined />
            </a>
          </Button>
        </>
      );
    },
    [t],
  );

  const handleCreateArtist = useCallback(
    async (preset?: string) => {
      const res = preset || window.prompt(t("song.artistName"));
      if (!res) {
        return;
      }

      const names = Array.from(
        new Set(
          res
            .split(/[,，]/gi)
            .map((i) => i.trim())
            .filter((i) => !!i),
        ),
      );

      const artists = await createOrGetCollectionsByArtistNames(names);

      message.success(t("created"));

      const existingCollections = form?.getFieldValue("_collectionIds") || [];
      form?.setFieldValue(
        "_collectionIds",
        Array.from(
          new Set([...artists.map((a) => a.id), ...existingCollections]),
        ),
      );
    },
    [form, message, t],
  );

  const scroll = useMemo<ICrudyTableProps["scroll"]>(
    () => ({
      y: isMobile ? "calc(100dvh - 160px)" : "calc(100dvh - 200px)",
      x: true,
    }),
    [isMobile],
  );

  const saveModalProps = useMemo<ICrudyTableProps["saveModalProps"]>(
    () => ({
      styles: {
        body: {
          maxHeight: isMobile ? "calc(100dvh - 120px)" : "calc(100dvh - 150px)",
          overflowY: "auto",
        },
      },
    }),
    [isMobile],
  );

  const handleCopyFilename = useCallback(() => {
    return form?.getFieldValue("_file") || "";
  }, [form]);

  return (
    <>
      <CrudyTable<IRecord>
        className={cls(styles.wrapper, playerVisible && styles.playerVisible)}
        name={t("song._")}
        crudy={SongCrudy}
        columns={columns}
        searchParams={searchParams}
        afterListed={handleAfterListed}
        onSave={handleSave}
        beforeEdit={handleBeforeEdit}
        afterSaved={handleAfterSaved}
        onFormInit={setForm}
        scroll={scroll}
        actions={actions}
        saveModalProps={saveModalProps}
        extra={
          <>
            <div className={styles.windowed}>
              <LyricsCrudyButton emitter={LyricsCrudyEmitter} />
              <Divider type="vertical" />
              <CollectionCrudyButton emitter={CollectionCrudyEmitter} />
              <Divider type="vertical" />
              <Button
                type="primary"
                title={t("player.name")}
                onClick={() => setPlayerVisible(true)}
              >
                <CustomerServiceOutlined />
              </Button>
            </div>
            <div className={styles.mobile}>
              <Dropdown menu={{ items: menus }}>
                <Button>
                  <MoreOutlined />
                </Button>
              </Dropdown>
            </div>
          </>
        }
      >
        {(record) => (
          <>
            <Flex alignItems="center" justifyContent="flex-start">
              {t("continuesUpload")}:{" "}
              <Form.Item
                noStyle
                name="_continuesUpload"
                label={t("continuesUpload")}
              >
                <Switch />
              </Form.Item>
              {t("keepCover")}:{" "}
              <Form.Item noStyle name="_keepCover">
                <Switch />
              </Form.Item>
            </Flex>
            <Divider plain />
            <Form.Item name="filename" noStyle hidden>
              <Input />
            </Form.Item>
            <Form.Item name="digest" noStyle hidden>
              <Input />
            </Form.Item>
            <Form.Item name="mime" noStyle hidden>
              <Input />
            </Form.Item>
            <Form.Item name="ffprobeInfo" noStyle hidden>
              <Input />
            </Form.Item>
            <Form.Item
              name="_file"
              label={
                <Flex justifyContent="flex-start">
                  <span>{t("song._")}</span>
                  <Divider type="vertical" />
                  <CopyButton value={handleCopyFilename} />
                </Flex>
              }
              rules={[{ required: !record?.id }]}
            >
              <Input
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileChange}
              />
            </Form.Item>
            <Form.Item name="index" label={t("song.index")}>
              <InputNumber
                min={-9999}
                max={9999}
                step={1}
                precision={0}
                placeholder={t("song.index")}
              />
            </Form.Item>
            <Form.Item name="cover" label={t("song.cover")}>
              <Uploader serverURL={config.SERVER_STATIC_URL} accept="image/*" />
            </Form.Item>
            <Form.Item
              name="name"
              label={t("song.name")}
              rules={[{ required: true }]}
            >
              <WordInput
                maxLength={200}
                placeholder={t("song.name")}
                onTagCtrlClick={handleCreateArtist}
              />
            </Form.Item>
            <Form.Item name="_collectionIds" label={t("collection._")}>
              <CollectionSelector mode="multiple">
                <Button
                  onClick={() => CollectionCrudyEmitter.dispatchEvent("open")}
                >
                  {t("gocrud.manage")}
                  {t("collection._")}
                </Button>
                <Divider type="vertical" />
                <Button type="primary" onClick={() => handleCreateArtist()}>
                  {t("createArtistsFast")}
                </Button>
              </CollectionSelector>
            </Form.Item>
            <Form.Item name="_lyricsIds" label={t("lyrics._")}>
              <LyricsSelector mode="multiple">
                <Button
                  onClick={() => LyricsCrudyEmitter.dispatchEvent("open")}
                >
                  {t("gocrud.manage")}
                  {t("lyrics._")}
                </Button>
              </LyricsSelector>
            </Form.Item>
            <Form.Item name="description" label={t("song.description")}>
              <Input.TextArea
                rows={10}
                maxLength={20000}
                placeholder={t("song.description")}
              />
            </Form.Item>
          </>
        )}
      </CrudyTable>
      {playerVisible && (
        <SongPlayer
          song={songForPlay}
          onClose={() => {
            setPlayerVisible(false);
            setSongForPlay(undefined);
          }}
        />
      )}
    </>
  );
}
