import { describe, expect, test } from "bun:test";
import { assignmentFor, rotationAssignee } from "./rotation";
import { addWeeks, currentWeek, isWeek, weekNumber, weekOf, weekRangeLabel, weeksBetween } from "./weeks";

describe("uker", () => {
  test("weekOf finner mandagen", () => {
    expect(weekOf("2026-11-12")).toBe("2026-11-09"); // torsdag
    expect(weekOf("2026-11-09")).toBe("2026-11-09"); // mandag
    expect(weekOf("2026-11-15")).toBe("2026-11-09"); // søndag
    expect(weekOf("2027-01-01")).toBe("2026-12-28"); // over nyttår
  });

  test("currentWeek bruker norsk tid", () => {
    // Søndag 23:30 i Oslo er fortsatt samme uke, selv om det er mandag i andre tidssoner.
    expect(currentWeek(new Date("2026-11-15T22:30:00Z"))).toBe("2026-11-09");
    // Mandag 00:30 i Oslo er ny uke, selv om det er søndag i UTC.
    expect(currentWeek(new Date("2026-11-15T23:30:00Z"))).toBe("2026-11-16");
  });

  test("addWeeks og weeksBetween går over sommertid", () => {
    expect(addWeeks("2026-03-23", 1)).toBe("2026-03-30");
    expect(weeksBetween("2026-03-23", "2026-11-09")).toBe(33);
    expect(weeksBetween("2026-11-09", "2026-11-02")).toBe(-1);
  });

  test("ukenummer", () => {
    expect(weekNumber("2026-11-09")).toBe(46);
    expect(weekNumber("2026-12-28")).toBe(53);
    expect(weekNumber("2027-01-04")).toBe(1);
  });

  test("etikett for uke", () => {
    expect(weekRangeLabel("2026-11-09")).toBe("9.–15. nov.");
    expect(weekRangeLabel("2026-11-30")).toBe("30. nov.–6. des.");
  });

  test("isWeek godtar bare mandager", () => {
    expect(isWeek("2026-11-09")).toBe(true);
    expect(isWeek("2026-11-10")).toBe(false);
    expect(isWeek("tull")).toBe(false);
  });
});

describe("rotasjon", () => {
  const area = { intervalWeeks: 1, startWeek: "2026-11-09", memberIds: ["a", "b", "c"] };

  test("hver uke", () => {
    expect(rotationAssignee(area, "2026-11-09")).toBe("a");
    expect(rotationAssignee(area, "2026-11-16")).toBe("b");
    expect(rotationAssignee(area, "2026-11-23")).toBe("c");
    expect(rotationAssignee(area, "2026-11-30")).toBe("a");
  });

  test("annenhver uke", () => {
    const biweekly = { ...area, intervalWeeks: 2 };
    expect(rotationAssignee(biweekly, "2026-11-09")).toBe("a");
    expect(rotationAssignee(biweekly, "2026-11-16")).toBe("a");
    expect(rotationAssignee(biweekly, "2026-11-23")).toBe("b");
  });

  test("ingen før start eller uten deltakere", () => {
    expect(rotationAssignee(area, "2026-11-02")).toBeNull();
    expect(rotationAssignee({ ...area, memberIds: [] }, "2026-11-09")).toBeNull();
  });

  test("overstyring påvirker bare én uke", () => {
    expect(assignmentFor(area, "2026-11-16", { userId: "c" })).toEqual({
      kind: "user",
      userId: "c",
      overridden: true,
    });
    expect(assignmentFor(area, "2026-11-16", { userId: null })).toEqual({ kind: "skipped" });
    expect(assignmentFor(area, "2026-11-23", undefined)).toEqual({
      kind: "user",
      userId: "c",
      overridden: false,
    });
  });
});
