import { describe, expect, test } from "bun:test";
import {
  addMonths,
  isDate,
  isTime,
  longDateLabel,
  minutesOnDay,
  monthGrid,
  monthLabel,
  rangeLabel,
  timeLabelForDay,
  weekDays,
} from "./dates";

describe("datoer", () => {
  test("isDate og isTime", () => {
    expect(isDate("2026-11-14")).toBe(true);
    expect(isDate("2026-02-30")).toBe(false);
    expect(isDate("tull")).toBe(false);
    expect(isTime("09:30")).toBe(true);
    expect(isTime("24:00")).toBe(false);
  });

  test("addMonths holder seg innenfor måneden", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-11-14", 1)).toBe("2026-12-14");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
  });

  test("månedsrute starter mandag og dekker hele måneden", () => {
    const grid = monthGrid("2026-11-12");
    expect(grid[0][0]).toBe("2026-10-26");
    expect(grid.at(-1)?.at(-1)).toBe("2026-12-06");
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(grid.flat()).toContain("2026-11-30");
  });

  test("uke fra mandag til søndag", () => {
    expect(weekDays("2026-11-12")).toEqual([
      "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15",
    ]);
  });

  test("etiketter", () => {
    expect(monthLabel("2026-11-12")).toBe("november 2026");
    expect(longDateLabel("2026-11-14")).toBe("lørdag 14. november");
    expect(rangeLabel("2026-11-30", "2026-12-06")).toBe("30. nov.–6. des.");
  });
});

describe("hendelser per dag", () => {
  const party = { startDate: "2026-11-14", startTime: "19:00", endDate: "2026-11-15", endTime: "02:00" };
  const trip = { startDate: "2026-12-20", startTime: null, endDate: "2026-12-27", endTime: null };

  test("tidsetikett", () => {
    expect(timeLabelForDay(party, "2026-11-14")).toBe("Fra 19:00");
    expect(timeLabelForDay(party, "2026-11-15")).toBe("Til 02:00");
    expect(timeLabelForDay(trip, "2026-12-22")).toBe("Hele dagen");
    expect(
      timeLabelForDay({ startDate: "2026-11-14", startTime: "10:00", endDate: "2026-11-14", endTime: "11:30" }, "2026-11-14"),
    ).toBe("10:00–11:30");
  });

  test("minutter på tidslinjen", () => {
    expect(minutesOnDay(party, "2026-11-14")).toEqual({ start: 19 * 60, end: 24 * 60 });
    expect(minutesOnDay(party, "2026-11-15")).toEqual({ start: 0, end: 120 });
    expect(
      minutesOnDay({ startDate: "2026-11-14", startTime: "10:00", endDate: "2026-11-14", endTime: null }, "2026-11-14"),
    ).toEqual({ start: 600, end: 660 });
  });
});
