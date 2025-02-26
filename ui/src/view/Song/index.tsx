import { CrudyTable, searchable } from "@allape/gocrud-react";
import { Divider, Form, TableColumnsType } from "antd";
import { ReactElement, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArtistCrudy } from "../../api/artist.ts";
import { SongArtistCrudy, SongCrudy } from "../../api/song.ts";
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
  _tags?: string[];
  _artists?: IArtist["id"][];
  _artistNames?: IArtist["name"][];
}

export default function Song(): ReactElement {
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useState<ISearchParams>({});

  const columns = useMemo<TableColumnsType<IRecord>>(
    () => [
      {
        title: t("id"),
        dataIndex: "id",
      },
      {
        title: t("song.name"),
        dataIndex: "name",
        filtered: !!searchParams["like_name"],
        ...searchable(t("song.name"), (value) =>
          setSearchParams((old) => ({
            ...old,
            keyword: value,
          })),
        ),
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

  return (
    <CrudyTable<IRecord>
      name={t("song._")}
      crudy={SongCrudy}
      columns={columns}
      afterListed={handleAfterListed}
      titleExtra={
        <>
          <Divider type="vertical" />
          <ArtistCrudyButton />
        </>
      }
    >
      <Form.Item name="artistId" label={t("artist._")}>
        <ArtistSelector mode="multiple" />
      </Form.Item>
    </CrudyTable>
  );
}
