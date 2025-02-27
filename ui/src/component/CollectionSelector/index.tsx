import { BaseSearchParams } from "@allape/gocrud";
import { CrudySelector } from "@allape/gocrud-react";
import { ICrudySelectorProps } from "@allape/gocrud-react/src/component/CrudySelector";
import { PropsWithChildren, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { CollectionCrudy } from "../../api/collection.ts";
import { ICollection } from "../../model/collection.ts";

export type ICollectionSelectorProps = Partial<
  ICrudySelectorProps<ICollection>
>;

export default function CollectionSelector(
  props: PropsWithChildren<ICollectionSelectorProps>,
): ReactElement {
  const { t } = useTranslation();
  return (
    <CrudySelector<ICollection>
      placeholder={`${t("select")} ${t("collection._")}`}
      {...props}
      crudy={CollectionCrudy}
      pageSize={10}
      searchParams={BaseSearchParams}
      searchPropName="keywords"
    />
  );
}
