import { BaseSearchParams } from "@allape/gocrud";
import {
  CrudySelector,
  type ICrudySelectorProps,
  PagedCrudySelector,
} from "@allape/gocrud-react";
import { PropsWithChildren, ReactElement, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LyricsCrudy } from "../../api/lyrics.ts";
import { ILyrics, ILyricsSearchParams } from "../../model/lyrics.ts";

export interface ILyricsSelectorProps
  extends Partial<ICrudySelectorProps<ILyrics>> {
  all?: boolean;
}

export default function LyricsSelector({
  all,
  ...props
}: PropsWithChildren<ILyricsSelectorProps>): ReactElement {
  const { t } = useTranslation();

  const sp = useMemo<ILyricsSearchParams>(
    () => ({
      ...BaseSearchParams,
      orderBy_updatedAt: "desc",
      orderBy_index: "asc",
    }),
    [],
  );

  return all ? (
    <CrudySelector<ILyrics, ILyricsSearchParams>
      placeholder={`${t("select")} ${t("lyrics._")}`}
      {...props}
      crudy={LyricsCrudy}
      searchParams={sp}
    />
  ) : (
    <PagedCrudySelector<ILyrics, ILyricsSearchParams>
      placeholder={`${t("select")} ${t("lyrics._")}`}
      {...props}
      crudy={LyricsCrudy}
      pageSize={1000}
      searchParams={sp}
      searchPropName="like_name"
    />
  );
}
