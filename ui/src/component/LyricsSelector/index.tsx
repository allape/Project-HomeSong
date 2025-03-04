import { BaseSearchParams } from "@allape/gocrud";
import { PagedCrudySelector } from "@allape/gocrud-react";
import { ICrudySelectorProps } from "@allape/gocrud-react/src/component/CrudySelector";
import { PropsWithChildren, ReactElement, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LyricsCrudy } from "../../api/lyrics.ts";
import { ILyrics, ILyricsSearchParams } from "../../model/lyrics.ts";

export type LyricsSelectorProps = Partial<ICrudySelectorProps<ILyrics>>;

export default function LyricsSelector(
  props: PropsWithChildren<LyricsSelectorProps>,
): ReactElement {
  const { t } = useTranslation();

  const sp = useMemo<ILyricsSearchParams>(
    () => ({
      ...BaseSearchParams,
      orderBy_index: "asc",
    }),
    [],
  );

  return (
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
