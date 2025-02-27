import { BaseSearchParams } from "@allape/gocrud";
import {
  asDefaultPattern,
  config,
  CrudyTable,
  searchable,
  Uploader,
} from "@allape/gocrud-react";
import { MoreOutlined, PictureOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Divider,
  Dropdown,
  Form,
  FormInstance,
  Input,
  MenuProps,
  TableColumnsType,
} from "antd";
import {
  ChangeEvent,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import NewCrudyButtonEventEmitter from "../../../../../gocrud-react/src/component/CrudyButton/eventemitter.ts";
import { EllipsisCell } from "../../../../../gocrud-react/src/helper/antd.tsx";
import { saveCollectionSongsBySong } from "../../api/collection.ts";
import {
  fillSongsWithCollections,
  ISongWithCollections,
  SongCrudy,
  upload,
} from "../../api/song.ts";
import ICollectionCrudyButton from "../../component/CollectionCrudyButton";
import CollectionPlayer from "../../component/CollectionPlayer";
import CollectionSelector from "../../component/CollectionSelector";
import { ICollection } from "../../model/collection.ts";
import { ISong, ISongSearchParams } from "../../model/song.ts";
import styles from "./style.module.scss";

type ISearchParams = ISongSearchParams;

interface IRecord extends ISong {
  _file?: File;
  _collectionIds?: ICollection["id"][];
  _collectionNames?: ICollection["name"][];
}

export default function Song(): ReactElement {
  const { t } = useTranslation();

  const CollectionCrudyEmitter = useMemo(
    () => NewCrudyButtonEventEmitter<ICollection>(),
    [],
  );

  const fileRef = useRef<File | undefined>();

  const [searchParams, setSearchParams] = useState<ISearchParams>(() => ({
    ...BaseSearchParams,
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
        dataIndex: "id",
      },
      {
        title: t("song.cover"),
        dataIndex: "cover",
        width: 100,
        render: (v) => {
          const url = `${config.SERVER_STATIC_URL}${v}`;
          return v ? (
            <Avatar
              className={styles.avatar}
              size={64}
              src={url}
              onClick={() => window.open(url)}
            />
          ) : (
            <Avatar size={64} icon={<PictureOutlined />} />
          );
        },
      },
      {
        title: t("song.mime"),
        dataIndex: "mime",
      },
      {
        title: t("song.name"),
        dataIndex: "name",
        render: (v, record) => {
          return (
            <div>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setPlayerVisible(true);
                  setSongForPlay(record as ISongWithCollections);
                }}
              >
                {record._collectionNames?.length
                  ? `${record._collectionNames.join(" | ")} - `
                  : ""}
                {v}
              </Button>
              <div style={{ paddingLeft: "7px" }}>{record.digest}</div>
            </div>
          );
        },
        filtered: !!searchParams["like_name"],
        ...searchable(t("song.name"), (value) =>
          setSearchParams((old) => ({
            ...old,
            like_name: value,
          })),
        ),
      },
      {
        title: t("song.ffprobeInfo"),
        dataIndex: "ffprobeInfo",
        render: (v) => EllipsisCell()(v),
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
      return swcs.map<IRecord>((s) => ({
        ...s,
        _collectionIds: s._collections.map((c) => c.id),
        _collectionNames: s._collections.map((c) => c.name),
      }));
    },
    [],
  );

  const handleSave = useCallback(async (record: IRecord): Promise<IRecord> => {
    const song = await upload(record, fileRef.current);

    fileRef.current = undefined;

    await saveCollectionSongsBySong(song.id, record._collectionIds || []);

    return song;
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!form) {
        return;
      }

      fileRef.current = e.target.files?.[0];

      if (fileRef.current && !form.getFieldValue("name")) {
        form.setFieldValue("name", fileRef.current.name.split(".")[0]);
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
        key: "Player",
        label: t("player.name"),
        onClick: () => {
          setPlayerVisible(true);
        },
      },
    ],
    [CollectionCrudyEmitter, t],
  );

  return (
    <>
      <CrudyTable<IRecord>
        className={styles.wrapper}
        name={t("song._")}
        crudy={SongCrudy}
        columns={columns}
        searchParams={searchParams}
        afterListed={handleAfterListed}
        onSave={handleSave}
        onFormInit={setForm}
        titleExtra={
          <>
            <div className={styles.windowed}>
              <Divider type="vertical" />
              <ICollectionCrudyButton emitter={CollectionCrudyEmitter} />
              <Divider type="vertical" />
              <Button type="primary" onClick={() => setPlayerVisible(true)}>
                {t("player.name")}
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
              label={t("song._")}
              rules={[{ required: !record?.id }]}
            >
              <Input
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileChange}
              />
            </Form.Item>
            <Form.Item name="cover" label={t("song.cover")}>
              <Uploader serverURL={config.SERVER_STATIC_URL} />
            </Form.Item>
            <Form.Item
              name="name"
              label={t("song.name")}
              rules={[{ required: true }]}
            >
              <Input maxLength={200} placeholder={t("song.name")} />
            </Form.Item>
            <Form.Item name="_collectionIds" label={t("collection._")}>
              <CollectionSelector mode="multiple">
                <Button
                  onClick={() => CollectionCrudyEmitter.dispatchEvent("open")}
                >
                  {t("gocrud.manage")}
                </Button>
              </CollectionSelector>
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
        <CollectionPlayer
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
