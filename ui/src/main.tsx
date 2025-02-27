import { i18n } from "@allape/gocrud-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "./App.tsx";

i18n
  .setup({
    zh: {
      translation: {
        ...i18n.ZHCN,

        id: "ID",
        select: "选择",
        createdAt: "创建时间",
        updatedAt: "更新时间",

        song: {
          _: "歌曲",
          name: "歌曲名称",
          cover: "封面",
          ffprobeInfo: "FFProbe 信息",
          mime: "MIME",
        },
        artist: {
          _: "艺术家",
          name: "名称",
          nameRoman: "拼音",
          portrait: "头像",
        },
      },
    },
    en: {
      translation: {
        ...i18n.EN,

        id: "ID",
        select: "Select",
        createdAt: "Created At",
        updatedAt: "Updated At",

        song: {
          _: "Song",
          name: "Name",
          cover: "Cover",
          ffprobeInfo: "FFProbe Info",
          mime: "MIME",
        },
        artist: {
          _: "Artist",
          name: "Name",
          nameRoman: "Roman Name",
          portrait: "Portrait",
        },
      },
    },
  })
  .then(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
