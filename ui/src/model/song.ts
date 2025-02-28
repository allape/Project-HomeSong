import { IBase, IBaseSearchParams } from "@allape/gocrud";

export interface ISong extends IBase {
  name: string;
  filename: string;
  cover: string;
  digest: string;
  mime: string;
  ffprobeInfo: string;
  description: string;
}

export interface ISongSearchParams extends IBaseSearchParams {
  like_name?: string;
  in_id?: ISong["id"][];
  orderBy_index?: "desc" | "asc";
  orderBy_createdAt?: "desc" | "asc";
  orderBy_updatedAt?: "desc" | "asc";
}
