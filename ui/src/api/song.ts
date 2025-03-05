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
  _collections: ICollection[];
  _artistName: string;
  _nonartistName: string;
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
    const aIds = collectionSongs
      .filter((cs) => cs.songId === s.id)
      .map((cs) => cs.collectionId);

    const cs = collections.filter((a) => aIds.includes(a.id));

    return {
      ...s,
      _collections: cs,
      _artistName: cs
        .filter((c) => c.type === "artist")
        .map((c) => c.name)
        .join(", "),
      _nonartistName: cs
        .filter((c) => c.type !== "artist")
        .map((c) => c.name)
        .join(", "),
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
