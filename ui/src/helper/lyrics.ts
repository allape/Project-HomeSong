export type Millisecond = number;
export type TimePoint = Millisecond;
export type Syllable = [TimePoint, TimePoint, string];
export type Line = [TimePoint, TimePoint, Syllable[]];

export default class Lyrics {
  public readonly lines: Line[] = [];

  public getLineByTimePoint(tp: TimePoint): Line | null {
    const index = this.getLineIndexByTimePoint(tp);
    return index !== -1 ? this.lines[index] : null;
  }

  public getLineIndexByTimePoint(tp: TimePoint): number {
    return this.lines.findIndex(
      (line) => line[0] <= tp && (line[1] === 0 || tp < line[1]),
    );
  }

  public getLineStringByTimePoint(tp: TimePoint): string | null {
    return (
      this.getLineByTimePoint(tp)?.[2]
        .map((i) => i[2])
        .join("") ?? null
    );
  }

  public toString(): string {
    return this.lines
      .map((line) =>
        line[2]
          .map((syllable) => {
            const [st, et, word] = syllable;
            return `${Lyrics.toStringTimePoint(st)}${word}${et > 0 ? `${Lyrics.toStringTimePoint(et)}` : ""}`;
          })
          .join(""),
      )
      .join("\n");
  }

  /**
   * Parse standard LRC format
   * @see https://en.wikipedia.org/wiki/LRC_(file_format)
   * @param text standard LRC format text
   */
  public static parseStandardLRC(text: string): Lyrics {
    if (!text?.trim()) return new Lyrics();
    const lines = text.split("\n").map((i) => i.trim());

    const formatted: string[] = [];

    lines.forEach((line) => {
      if (!line.trim()) return;
      const [, tps, words] = line.match(/((?:\[\d+:\d+\.\d+]\s*)+)(.+)/) || [];
      if (tps) {
        const timePoints = tps
          .split("]")
          .map((i) => i.trim())
          .filter((i) => !!i)
          .map((i) => `${i}]`);
        formatted.push(...timePoints.map((tp) => `${tp}${words}`));
      }
    });

    return this.parse(formatted.join("\n"));
  }

  /**
   * https://en.wikipedia.org/wiki/LRC_(file_format)
   * @param text LRC format text with word by word timestamp
   * ```
   * [00:00.00]Ly[00:00.20]ri[00:00.30]cs[00:00.40]
   * [00:00.00]歌[00:00.20]词[00:00.30]
   * ```
   */
  public static parse(text: string): Lyrics {
    text = text.trim();

    const lyrics = new Lyrics();

    if (!text) {
      return lyrics;
    }

    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;

      const syllables = this.parseLine(line);

      if (syllables.length === 0) {
        continue;
      }

      // the start time point of current line
      const lineStp = syllables[0][0];

      if (lyrics.lines.length > 0) {
        const prevLine = lyrics.lines[lyrics.lines.length - 1];
        // use the start time point of the first syllable of current line
        //     to fill the end time of the last syllable of prev line
        if (prevLine[2].length > 0) {
          const lastSyllableOfPrevLine = prevLine[2][prevLine[2].length - 1];
          if (!lastSyllableOfPrevLine[1]) {
            lastSyllableOfPrevLine[1] = lineStp || 0;
          }
        }
        // use the start time point of current line to fill the end time of the prev line
        prevLine[1] = lineStp;
      }

      lyrics.lines.push([lineStp, 0, syllables]);
    }

    // sort by start time point asc
    lyrics.lines.sort((a, b) => a[0] - b[0]);

    return lyrics;
  }

  public static parseLine(line: string): Syllable[] {
    const syllables: Syllable[] = [];

    let failSafeIndex = 0;
    while (line.length > 0) {
      if (++failSafeIndex > 1000) {
        break;
      }

      const [full, st, syllable] =
        line.trimStart().match(/^(\[\d+:\d+(?:\.\d+)?])([^[]*)/) || [];
      if (!full || !st) {
        break;
      }

      line = line.substring(full.length);

      const stp = this.fromStringTimePoint(st);
      if (isNaN(stp)) {
        continue;
      }

      // use the start time point of current syllable to fill the end time of the prev syllable
      const prevSyllable = syllables[syllables.length - 1];
      if (prevSyllable) {
        prevSyllable[1] = stp;
      }

      if (syllable) {
        syllables.push([stp, 0, syllable]);
      }
    }

    // sort by start time point asc
    syllables.sort((a, b) => a[0] - b[0]);

    return syllables;
  }

  /**
   * [mm:ss.SS(SS)?] to millisecond
   */
  public static fromStringTimePoint(time: string): TimePoint {
    if (!time) return 0;

    const [, m, s] = time.match(/^\[?(\d+):?(\d+(?:\.\d*)?)?]?$/) || [];

    let tp = 0;

    if (m) {
      tp += parseInt(m) * 60 * 1000;
    }
    if (s) {
      tp += parseFloat(s) * 1000;
    }

    return tp;
  }

  /**
   * {@link TimePoint} to [mm:ss.SS]
   * @param tp
   */
  public static toStringTimePoint(tp: TimePoint): string {
    const m = Math.floor(tp / 60_000);
    const s = (tp % 60_000) / 1000;
    return `[${`${m}`.padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}]`;
  }
}
