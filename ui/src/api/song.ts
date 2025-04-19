import Crudy, { config, get } from "@allape/gocrud-react";
import {
  ICollection,
  ICollectionSearchParams,
  ICollectionSongSearchParams,
} from "../model/collection.ts";
import { ILyrics } from "../model/lyrics.ts";
import { ISong, ISongLyrics } from "../model/song.ts";
import { CollectionCrudy, CollectionSongCrudy } from "./collection.ts";

export const SongCrudy = new Crudy<ISong>(`${config.SERVER_URL}/song`);

export function upload(song: Partial<ISong>, file?: File): Promise<ISong> {
  const form = new FormData();
  form.append("song", JSON.stringify(song));
  if (file) {
    form.append("file", file);
  }
  return get(`${config.SERVER_URL}/song/upload`, {
    method: "PUT",
    body: form,
  });
}

export interface ISongWithCollections extends ISong {
  _collections?: ICollection[];
  _singerNames?: string;
  _singerIds?: ICollection["id"][];
  _lyricistNames?: string;
  _lyricistIds?: ICollection["id"][];
  _composerNames?: string;
  _composerIds?: ICollection["id"][];
  _arrangerNames?: string;
  _arrangerIds?: ICollection["id"][];
  _otherNames?: string;
  _otherIds?: ICollection["id"][];
  _nonSingerNames?: string;
  _nonSingerIds?: ICollection["id"][];
  _nonArtistNames?: string;
  _nonArtistNameArr?: string[];
  _nonArtistIds?: ICollection["id"][];
}

export async function fillSongsWithCollections(
  songs: ISong[],
): Promise<ISongWithCollections[]> {
  if (songs.length === 0) {
    return [];
  }

  const songIds = Array.from(new Set(songs.map((s) => s.id)));
  const collectionSongs =
    await CollectionSongCrudy.all<ICollectionSongSearchParams>({
      in_songId: songIds,
    });

  const collectionIds = Array.from(
    new Set(collectionSongs.map((cs) => cs.collectionId)),
  );

  let collections: ICollection[] = [];
  if (collectionIds.length > 0) {
    collections = await CollectionCrudy.page<ICollectionSearchParams>(
      1,
      collectionIds.length,
      {
        in_id: collectionIds,
      },
    );
  }

  return songs.map<ISongWithCollections>((s) => {
    const currentCss = collectionSongs.filter((cs) => cs.songId === s.id);
    const currentCsIds = currentCss.map((cs) => cs.collectionId);

    const singerIds = currentCss
      .filter((cs) => cs.role === "singer")
      .map((cs) => cs.collectionId);

    const lyricistIds = currentCss
      .filter((cs) => cs.role === "lyricist")
      .map((cs) => cs.collectionId);

    const composerIds = currentCss
      .filter((cs) => cs.role === "composer")
      .map((cs) => cs.collectionId);

    const arrangerIds = currentCss
      .filter((cs) => cs.role === "arranger")
      .map((cs) => cs.collectionId);

    const otherIds = currentCss
      .filter((cs) => cs.role === "other")
      .map((cs) => cs.collectionId);

    const nonArtistIds = currentCss
      .filter((cs) => cs.role === "_")
      .map((cs) => cs.collectionId);

    const nonSingerIds = currentCss
      .filter(
        (cs) =>
          cs.role !== "singer" &&
          cs.role !== "_" &&
          !singerIds.includes(cs.collectionId),
      )
      .map((cs) => cs.collectionId);

    const cs = collections.filter((c) => currentCsIds.includes(c.id));

    const nonArtistNames = collections
      .filter((c) => nonArtistIds.includes(c.id))
      .map((c) => c.name);

    return {
      ...s,
      _collections: cs,

      _singerNames: collections
        .filter((c) => singerIds.includes(c.id))
        .map((c) => c.name)
        .join(" & "),
      _singerIds: singerIds,

      _lyricistNames: collections
        .filter((c) => lyricistIds.includes(c.id))
        .map((c) => c.name)
        .join(" & "),
      _lyricistIds: lyricistIds,

      _composerNames: collections
        .filter((c) => composerIds.includes(c.id))
        .map((c) => c.name)
        .join(" & "),
      _composerIds: composerIds,

      _arrangerNames: collections
        .filter((c) => arrangerIds.includes(c.id))
        .map((c) => c.name)
        .join(" & "),
      _arrangerIds: arrangerIds,

      _otherNames: collections
        .filter((c) => otherIds.includes(c.id))
        .map((c) => c.name)
        .join(" & "),
      _otherIds: otherIds,

      _nonSingerNames: collections
        .filter((c) => nonSingerIds.includes(c.id))
        .map((c) => c.name)
        .join(" & "),
      _nonSingerIds: nonSingerIds,

      _nonArtistNames: nonArtistNames.join(", "),
      _nonArtistNameArr: nonArtistNames,
      _nonArtistIds: nonArtistIds,
    };
  });
}

export function getLyrics(id: ISong["id"]): Promise<ILyrics[]> {
  return get(`${config.SERVER_URL}/song/lyrics/${id}`);
}

export function saveLyricsBySong(
  songId: ISong["id"],
  lyrics: ILyrics["id"][],
): Promise<ISongLyrics[]> {
  return get(
    `${config.SERVER_URL}/song/lyrics/${songId}?lyricsIds=${encodeURIComponent(lyrics.join(","))}`,
    {
      method: "PUT",
    },
  );
}
