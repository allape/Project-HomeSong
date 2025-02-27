import { BaseSearchParams } from "@allape/gocrud";
import {
  config,
  CrudyButton,
  searchable,
  Uploader,
} from "@allape/gocrud-react";
import { ICrudyButtonProps } from "@allape/gocrud-react/src/component/CrudyButton";
import { UserOutlined } from "@ant-design/icons";
import { Avatar, Form, Input, TableColumnsType } from "antd";
import { ReactElement, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArtistCrudy } from "../../api/artist.ts";
import { IArtist, IArtistSearchParams } from "../../model/artist.ts";

type IRecord = IArtist;
type ISearchParams = IArtistSearchParams;

export type IArtistCrudyButtonProps = Partial<ICrudyButtonProps<IRecord>>;

export default function ArtistCrudyButton(
  props: IArtistCrudyButtonProps,
): ReactElement {
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useState<ISearchParams>(() => ({
    ...BaseSearchParams,
  }));

  const columns = useMemo<TableColumnsType<IRecord>>(
    () => [
      {
        title: t("id"),
        dataIndex: "id",
      },
      {
        title: t("artist.portrait"),
        dataIndex: "portrait",
        width: 100,
        render: (v) =>
          v ? (
            <Avatar size={64} src={`${config.SERVER_STATIC_URL}${v}`} />
          ) : (
            <Avatar size={64} icon={<UserOutlined />} />
          ),
      },
      {
        title: t("artist.name"),
        dataIndex: "name",
        render: (v, r) => (
          <div>
            <div>{v}</div>
            <div>{r.nameRoman}</div>
          </div>
        ),
        filtered: !!searchParams["keyword"],
        ...searchable(t("artist.name"), (value) =>
          setSearchParams((old) => ({
            ...old,
            keyword: value,
          })),
        ),
      },
    ],
    [searchParams, t],
  );

  return (
    <CrudyButton
      name={t("artist._")}
      columns={columns}
      crudy={ArtistCrudy}
      searchParams={searchParams}
      {...props}
    >
      <Form.Item name="portrait" label={t("artist.portrait")}>
        <Uploader serverURL={config.SERVER_STATIC_URL} />
      </Form.Item>
      <Form.Item
        name="name"
        label={t("artist.name")}
        rules={[{ required: true }]}
      >
        <Input maxLength={200} placeholder={t("artist.name")} />
      </Form.Item>
      <Form.Item name="nameRoman" label={t("artist.nameRoman")}>
        <Input maxLength={200} placeholder={t("artist.nameRoman")} />
      </Form.Item>
    </CrudyButton>
  );
}
