import { IBase, IBaseSearchParams } from "@allape/gocrud";
import { IArtist } from "./artist.ts";

export interface ISong extends IBase {
  name: string;
  cover: string;
  digest: string;
  mime: string;
  ffprobeInfo: string;
}

export interface ISongSearchParams extends IBaseSearchParams {
  like_name?: string;
  in_id?: ISong["id"][];
  artistId?: IArtist["id"];
}

export interface ISongArtist extends Pick<IBase, "createdAt"> {
  songId: ISong["id"];
  artistId: IArtist["id"];
}

export interface ISongArtistSearchParams extends IBaseSearchParams {
  in_songId?: ISong["id"][];
  in_artistId?: IArtist["id"][];
}
