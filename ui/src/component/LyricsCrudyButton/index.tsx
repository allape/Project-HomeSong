import { BaseSearchParams } from "@allape/gocrud";
import {
  asDefaultPattern,
  CrudyButton,
  Ellipsis,
  Flex,
  searchable,
  useMobile,
} from "@allape/gocrud-react";
import { ICrudyButtonProps } from "@allape/gocrud-react/src/component/CrudyButton";
import { LyricsDriver } from "@allape/lyrics";
import { CopyOutlined } from "@ant-design/icons";
import {
  Button,
  Divider,
  Form,
  FormInstance,
  Input,
  InputNumber,
  TableColumnsType,
} from "antd";
import { DragEvent, ReactElement, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LyricsCrudy } from "../../api/lyrics.ts";
import { LyricsCreatorDocURL } from "../../config/lyrics.ts";
import { ILyrics, ILyricsSearchParams } from "../../model/lyrics.ts";
import CopyButton from "../CopyButton";

type IRecord = ILyrics;
type ISearchParams = ILyricsSearchParams;

export type ILyricsCrudyButtonProps = Partial<ICrudyButtonProps<IRecord>>;

export default function LyricsCrudyButton(
  props: ILyricsCrudyButtonProps,
): ReactElement {
  const { t } = useTranslation();

  const isMobile = useMobile();

  const [form, setForm] = useState<FormInstance<ILyrics> | null>(null);
  const [searchParams, setSearchParams] = useState<ISearchParams>(() => ({
    ...BaseSearchParams,
    orderBy_updatedAt: "desc",
  }));

  const columns = useMemo<TableColumnsType<IRecord>>(
    () => [
      {
        title: t("id"),
        dataIndex: "id",
      },
      {
        title: <span className="nowrap">{t("lyrics.index")}</span>,
        dataIndex: "index",
      },
      {
        title: t("lyrics.name"),
        dataIndex: "name",
        render: (v) => (
          <CopyButton value={v}>
            {v} <CopyOutlined />
          </CopyButton>
        ),
        filtered: !!searchParams["like_name"],
        ...searchable(t("lyrics.name"), (value) =>
          setSearchParams((old) => ({
            ...old,
            like_name: value,
          })),
        ),
      },
      {
        title: t("lyrics.content"),
        dataIndex: "content",
        render: (v) => <Ellipsis>{v}</Ellipsis>,
      },
      {
        title: <span className="nowrap">{t("lyrics.description")}</span>,
        dataIndex: "description",
        render: (v) => <Ellipsis>{v}</Ellipsis>,
      },
      {
        title: t("createdAt"),
        dataIndex: "createdAt",
        render: asDefaultPattern,
      },
      {
        title: t("updatedAt"),
        dataIndex: "updatedAt",
        render: asDefaultPattern,
      },
    ],
    [searchParams, t],
  );

  const handleParseStandardLRC = useCallback(() => {
    const lrc: string =
      window.prompt(t("lyrics.fromStandardLRC")) ||
      form?.getFieldValue("content");
    if (!lrc?.trim()) {
      return;
    }

    form?.setFieldValue("content", LyricsDriver.parseStandardLRC(lrc).save());
  }, [form, t]);

  const handleLRCPDrop = useCallback(
    async (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer?.files;
      const text = await files?.[0]?.text();
      if (!text) {
        return;
      }

      form?.setFieldValue("content", text);
    },
    [form],
  );

  const handleOpenLRCPReadme = useCallback(() => {
    window.open(LyricsCreatorDocURL);
  }, []);

  const handleCopyName = useCallback((): string => {
    return form?.getFieldValue("name");
  }, [form]);

  return (
    <CrudyButton
      name={t("lyrics._")}
      columns={columns}
      crudy={LyricsCrudy}
      searchParams={searchParams}
      scroll={{
        y: isMobile ? "calc(100dvh - 200px)" : "calc(100dvh - 260px)",
        x: true,
      }}
      onFormInit={setForm}
      {...props}
    >
      <Form.Item name="index" label={t("lyrics.index")}>
        <InputNumber
          min={-9999}
          max={9999}
          step={1}
          precision={0}
          placeholder={t("lyrics.index")}
        />
      </Form.Item>
      <Form.Item
        name="name"
        label={
          <Flex justifyContent="flex-start">
            {t("lyrics.name")}
            <CopyButton value={handleCopyName} />
          </Flex>
        }
        rules={[{ required: true }]}
      >
        <Input maxLength={200} placeholder={t("lyrics.name")} />
      </Form.Item>

      <Form.Item
        name="content"
        label={
          <>
            {t("lyrics.content")}
            <Divider type="vertical" />
            <Button type="link" onClick={handleOpenLRCPReadme}>
              {t("lyrics.howToMakeLRCPLyrics")}
            </Button>
            <Divider type="vertical" />
            <Button type="primary" onClick={handleParseStandardLRC}>
              {t("lyrics.fromStandardLRC")}
            </Button>
          </>
        }
        rules={[
          {
            required: true,
            message: t("required", {
              name: t("lyrics.content"),
            }),
          },
        ]}
      >
        <Input.TextArea
          onDrop={handleLRCPDrop}
          rows={10}
          placeholder={t("lyrics.content")}
        />
      </Form.Item>
      <Form.Item name="description" label={t("lyrics.description")}>
        <Input.TextArea
          maxLength={20000}
          rows={10}
          placeholder={t("lyrics.description")}
        />
      </Form.Item>
    </CrudyButton>
  );
}
