import { BaseSearchParams } from "@allape/gocrud";
import {
  asDefaultPattern,
  config,
  CrudyTable,
  Ellipsis,
  ICrudyTableProps,
  searchable,
  Uploader,
} from "@allape/gocrud-react";
import NewCrudyButtonEventEmitter from "@allape/gocrud-react/src/component/CrudyButton/eventemitter.ts";
import { MoreOutlined, PictureOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Col,
  Divider,
  Dropdown,
  Form,
  FormInstance,
  Input,
  InputNumber,
  MenuProps,
  Row,
  Switch,
  TableColumnsType,
} from "antd";
import cls from "classnames";
import {
  ChangeEvent,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { saveCollectionSongsBySong } from "../../api/collection.ts";
import {
  fillSongsWithCollections,
  ISongWithCollections,
  SongCrudy,
  upload,
} from "../../api/song.ts";
import CollectionCrudyButton from "../../component/CollectionCrudyButton";
import CollectionPlayer from "../../component/CollectionPlayer";
import CollectionSelector from "../../component/CollectionSelector";
import WordInput from "../../component/WordInput";
import useSafeHeight from "../../hook/useSafeHeight.ts";
import { ICollection } from "../../model/collection.ts";
import { ISong, ISongSearchParams } from "../../model/song.ts";
import styles from "./style.module.scss";

const SafeY = 56 + 10 * 2 + 55 + 32 + 16 * 2 + 2 + 10 * 2;

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
}

export default function Song(): ReactElement {
  const { t } = useTranslation();

  const CollectionCrudyEmitter = useMemo(
    () => NewCrudyButtonEventEmitter<ICollection>(),
    [],
  );

  const y = useSafeHeight(SafeY);

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
        width: 50,
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
        title: t("collection._"),
        dataIndex: "_nonartistName",
        width: 200,
        render: (v) => <Ellipsis>{v}</Ellipsis>,
        filtered: !!searchParams["like_name"],
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
        render: (v, record) => {
          return (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setPlayerVisible(true);
                setSongForPlay(record as ISongWithCollections);
              }}
            >
              {record._artistName ? `${record._artistName} - ` : ""}
              <Ellipsis length={100}>{v}</Ellipsis>
            </Button>
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
        title: t("song.mime"),
        dataIndex: "mime",
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
      return swcs.map<IRecord>((s) => ({
        ...s,
        _collectionIds: s._collections.map((c) => c.id),
        _artistNames: s._collections
          .filter((c) => c.type === "artist")
          .map((c) => c.name),
        _nonartistNames: s._collections
          .filter((c) => c.type !== "artist")
          .map((c) => c.name),
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
        key: "Player",
        label: t("player.name"),
        onClick: () => {
          setPlayerVisible(true);
        },
      },
    ],
    [CollectionCrudyEmitter, t],
  );

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
        afterSaved={handleAfterSaved}
        onFormInit={setForm}
        scroll={{ y, x: true }}
        titleExtra={
          <>
            <Divider type="vertical" />
            <div className={styles.windowed}>
              <CollectionCrudyButton emitter={CollectionCrudyEmitter} />
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
            <Row gutter={10}>
              <Col span={12}>
                <Form.Item name="_continuesUpload" label={t("continuesUpload")}>
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="_keepCover" label={t("keepCover")}>
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
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
              label={t("song._")}
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
              <Uploader serverURL={config.SERVER_STATIC_URL} />
            </Form.Item>
            <Form.Item
              name="name"
              label={t("song.name")}
              rules={[{ required: true }]}
            >
              <WordInput maxLength={200} placeholder={t("song.name")} />
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
