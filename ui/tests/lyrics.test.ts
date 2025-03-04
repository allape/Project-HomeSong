import Lyrics from '../src/helper/lyrics';

// https://guoyunhe.github.io/rabbit-lyrics
const Example = `
[00:00.00] 谁のことを考えてるの?
[00:03.10] ハートのスペース争夺戦
[00:05.76] 戦况的に 一进一退で
[00:10.56] 油断ならないな
[00:11.70] あのね 今のとこ ほんの数％しか
[00:16.73] アイツの心に 居场所がないんだ
`;

describe("test lyrics", () => {
  test("mmssSSSS", async () => {
    expect(Lyrics.mmssSSSS("[01]")).toBe(60_000);
    expect(Lyrics.mmssSSSS("[02:]")).toBe(120_000);
    expect(Lyrics.mmssSSSS("[03:00]")).toBe(180_000);
    expect(Lyrics.mmssSSSS("[03:01]")).toBe(181_000);
    expect(Lyrics.mmssSSSS("[03:02.]")).toBe(182_000);
    expect(Lyrics.mmssSSSS("[03:03.3]")).toBe(183_300);
    expect(Lyrics.mmssSSSS("[04:03.321]")).toBe(243_321);
    expect(Lyrics.mmssSSSS("5")).toBe(300_000);
    expect(Lyrics.mmssSSSS("5:1")).toBe(301_000);
    expect(Lyrics.mmssSSSS("5:1.111")).toBe(301_111);

    expect(Lyrics.mmssSSSS("6:abc")).toBe(0);
    expect(Lyrics.mmssSSSS("7:abc:123:abc")).toBe(0);
    expect(Lyrics.mmssSSSS("[05:00.abc]")).toBe(0);
    expect(Lyrics.mmssSSSS("abc")).toBe(0);
  });

  test("parse", () => {
    const l = Lyrics.parse(Example);
    expect(l.lines.length).toBe(6);
    expect(l.lines[0][0]).toBe(0);
    expect(l.lines[0][1]).toBe(3_100);
    expect(l.lines[0][2][0][0]).toBe(0);
    expect(l.lines[0][2][0][1]).toBe(3_100);
    expect(l.lines[0][2][0][2]).toBe(" 谁のことを考えてるの?");
    expect(l.lines[5][2][0][0]).toBe(16_730);
    expect(l.lines[5][2][0][1]).toBe(0);
    expect(l.lines[5][2][0][2]).toBe(" アイツの心に 居场所がないんだ");
    expect(l.lines[5][0]).toBe(16_730);
    expect(l.lines[5][1]).toBe(0);

    const l1 = l.getLineByTimePoint(2_000);
    expect(l1?.[0]).toBe(0);
    expect(l1?.[1]).toBe(3_100);
    expect(l1?.[2][0][2]).toBe(" 谁のことを考えてるの?");

    const l3 = l.getLineByTimePoint(6_000);
    expect(l3?.[0]).toBe(5_760);
    expect(l3?.[1]).toBe(10_560);
    expect(l3?.[2][0][2]).toBe(" 戦况的に 一进一退で");

    const l6 = l.getLineByTimePoint(17_000);
    expect(l6?.[0]).toBe(16_730);
    expect(l6?.[1]).toBe(0);
    expect(l6?.[2][0][2]).toBe(" アイツの心に 居场所がないんだ");

    expect(l.getLineIndexByTimePoint(2_000)).toBe(0);
    expect(l.getLineIndexByTimePoint(17_000)).toBe(5);

    expect(l.getLineStringByTimePoint(2_000)).toBe(" 谁のことを考えてるの?");
    expect(l.getLineStringByTimePoint(17_000)).toBe(" アイツの心に 居场所がないんだ");

    expect(l.getLineIndexByTimePoint(-1)).toBe(-1);
    expect(l.getLineIndexByTimePoint(-999)).toBe(-1);
    expect(l.getLineIndexByTimePoint(999_999_999)).toBe(5);
  });
});

