import { IBase, IBaseSearchParams } from "@allape/gocrud";
import { ICollection } from "./collection.ts";
import { ILyrics } from "./lyrics.ts";

export interface ISong extends IBase {
  name: string;
  filename: string;
  cover: string;
  digest: string;
  mime: string;
  ffprobeInfo: string;
  description: string;
  index: number;
}

export interface ISongSearchParams extends IBaseSearchParams {
  like_name?: string;
  in_id?: ISong["id"][];
  collectionId?: ICollection["id"];
  orderBy_index?: "desc" | "asc";
  orderBy_createdAt?: "desc" | "asc";
  orderBy_updatedAt?: "desc" | "asc";
}

export interface ISongLyrics {
  songId: ISong["id"];
  lyricsId: ILyrics["id"];
  createdAt: string;
}
