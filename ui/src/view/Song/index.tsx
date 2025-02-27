import { BaseSearchParams } from "@allape/gocrud";
import { config, CrudyTable, searchable, Uploader } from "@allape/gocrud-react";
import { PictureOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Divider,
  Form,
  FormInstance,
  Input,
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
import { ArtistCrudy } from "../../api/artist.ts";
import {
  saveSongArtists,
  SongArtistCrudy,
  SongCrudy,
  upload,
} from "../../api/song.ts";
import ArtistCrudyButton from "../../component/ArtistCrudyButton";
import ArtistSelector from "../../component/ArtistSelector";
import { IArtist, IArtistSearchParams } from "../../model/artist.ts";
import {
  ISong,
  ISongArtistSearchParams,
  ISongSearchParams,
} from "../../model/song.ts";

type ISearchParams = ISongSearchParams;

interface IRecord extends ISong {
  _file?: File;
  _collections?: string[];
  _artists?: IArtist["id"][];
  _artistNames?: IArtist["name"][];
}

export default function Song(): ReactElement {
  const { t } = useTranslation();

  const ArtistCrudyEmitter = useMemo(
    () => NewCrudyButtonEventEmitter<IArtist>(),
    [],
  );

  const fileRef = useRef<File | undefined>();
  const [searchParams, setSearchParams] = useState<ISearchParams>(() => ({
    ...BaseSearchParams,
  }));
  const [form, setForm] = useState<FormInstance<IRecord> | undefined>();

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
            <Avatar size={64} src={url} onClick={() => window.open(url)} />
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
          const url = `${config.SERVER_STATIC_URL}${record.filename}`;
          return (
            <div>
              <Button type="link" size="small" onClick={() => window.open(url)}>
                {record._artistNames?.length
                  ? `${record._artistNames.join(" | ")} - `
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
      },
      {
        title: t("updatedAt"),
        dataIndex: "updatedAt",
      },
    ],
    [searchParams, t],
  );

  const handleAfterListed = useCallback(
    async (records: IRecord[]): Promise<IRecord[]> => {
      if (records.length === 0) {
        return records;
      }

      const songIds = Array.from(new Set(records.map((record) => record.id)));
      const songArtists = await SongArtistCrudy.page<ISongArtistSearchParams>(
        1,
        songIds.length,
        {
          in_songId: songIds,
        },
      );

      const artistIds = Array.from(
        new Set(songArtists.map((songArtist) => songArtist.artistId)),
      );

      let artists: IArtist[] = [];
      if (artistIds.length > 0) {
        artists = await ArtistCrudy.page<IArtistSearchParams>(
          1,
          artistIds.length,
          {
            in_id: artistIds,
          },
        );
      }

      return records.map((record) => {
        const aIds = songArtists
          .filter((songArtist) => songArtist.songId === record.id)
          .map((songArtist) => songArtist.artistId);
        return {
          ...record,
          _artists: aIds,
          _artistNames: artists
            .filter((a) => aIds.includes(a.id))
            .map((a) => a.name),
        };
      });
    },
    [],
  );

  const handleSave = useCallback(async (record: IRecord): Promise<IRecord> => {
    const song = await upload(record, fileRef.current);

    fileRef.current = undefined;

    await saveSongArtists(song.id, record._artists || []);

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

  return (
    <CrudyTable<IRecord>
      name={t("song._")}
      crudy={SongCrudy}
      columns={columns}
      searchParams={searchParams}
      afterListed={handleAfterListed}
      onSave={handleSave}
      onFormInit={setForm}
      titleExtra={
        <>
          <Divider type="vertical" />
          <ArtistCrudyButton emitter={ArtistCrudyEmitter} />
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
          <Form.Item name="_artists" label={t("artist._")}>
            <ArtistSelector mode="multiple">
              <Button onClick={() => ArtistCrudyEmitter.dispatchEvent("open")}>
                {t("gocrud.manage")}
              </Button>
            </ArtistSelector>
          </Form.Item>
        </>
      )}
    </CrudyTable>
  );
}
