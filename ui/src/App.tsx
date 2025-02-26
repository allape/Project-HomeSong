import { i18n, ThemeProvider } from "@allape/gocrud-react";
import { Locale } from "antd/es/locale";
import zhCN from "antd/locale/zh_CN";
import { ReactElement } from "react";
import Song from "./view/Song";

function getLocale(): Locale | undefined {
  const language = i18n.getLanguage();
  if (language.startsWith("zh")) {
    import("dayjs/locale/zh-cn");
    return zhCN;
  }
  return undefined;
}

i18n
  .setup({
    zh: {
      translation: {
        ...i18n.ZHCN,

        select: "选择",

        song: {
          _: "歌曲",
          name: "歌曲名称",
        },
        artist: {
          _: "艺术家",
          name: "名称",
          portrait: "头像",
        },
      },
    },
    en: {
      translation: {
        ...i18n.EN,

        select: "Select",

        song: {
          _: "Song",
          name: "Name",
        },
        artist: {
          _: "Artist",
          name: "Name",
          portrait: "Portrait",
        },
      },
    },
  })
  .then();

export default function App(): ReactElement {
  return (
    <ThemeProvider locale={getLocale()}>
      <Song />
    </ThemeProvider>
  );
}
