import { IBase, IBaseSearchParams } from "@allape/gocrud";

export interface IArtist extends IBase {
  name: string;
  portrait: string;
}

export interface IArtistSearchParams extends IBaseSearchParams {
  in_id?: IArtist["id"][];
  like_name?: string;
}
