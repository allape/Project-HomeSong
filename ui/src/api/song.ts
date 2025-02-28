import Crudy, { config, get } from '@allape/gocrud-react';
import {
  ICollection,
  ICollectionSearchParams,
  ICollectionSongSearchParams,
} from "../model/collection.ts";
import { ISong } from "../model/song.ts";
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
    return {
      ...s,
      _collections: collections.filter((a) => aIds.includes(a.id)),
    };
  });
}
