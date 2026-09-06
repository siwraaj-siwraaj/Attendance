import { describe, expect, it } from "vitest";
import {
  type AttendanceValue,
  type Role,
  type Tab,
  canEditForRole,
  getAttendanceDisplay,
  getAttendanceLabel,
  getBadgeClass,
  sortWorkColumns,
  tabsForRole,
} from "../types";

describe("tabsForRole (RBAC tab routing)", () => {
  it("gives the admin every tab plus the admin panel", () => {
    const tabs = tabsForRole("admin");
    expect(tabs).toContain("contracts");
    expect(tabs).toContain("attendance");
    expect(tabs).toContain("advances");
    expect(tabs).toContain("payments");
    expect(tabs).toContain("labours");
    expect(tabs).toContain("settled");
    expect(tabs).toContain("admin");
  });

  it("restricts attendance-only users to the attendance tab", () => {
    expect(tabsForRole("attendanceOnly")).toEqual(["attendance"]);
  });

  it("restricts contract-only users to the contracts tab", () => {
    expect(tabsForRole("contractOnly")).toEqual(["contracts"]);
  });

  it("restricts view-only users to the attendance tab", () => {
    expect(tabsForRole("viewOnly")).toEqual(["attendance"]);
  });

  it("never exposes the admin panel to non-admin roles", () => {
    const nonAdmin: Role[] = ["attendanceOnly", "contractOnly", "viewOnly"];
    for (const role of nonAdmin) {
      expect(tabsForRole(role)).not.toContain("admin");
    }
  });
});

describe("canEditForRole", () => {
  it("allows writes for admin, attendance-only, and contract-only", () => {
    expect(canEditForRole("admin")).toBe(true);
    expect(canEditForRole("attendanceOnly")).toBe(true);
    expect(canEditForRole("contractOnly")).toBe(true);
  });

  it("denies writes for view-only", () => {
    expect(canEditForRole("viewOnly")).toBe(false);
  });
});

describe("attendance display helpers", () => {
  const present: AttendanceValue = { __kind__: "present", present: null };
  const absent: AttendanceValue = { __kind__: "absent", absent: null };
  const partial: AttendanceValue = { __kind__: "partial", partial: 0.5 };

  it("maps present/absent/partial to numeric display values", () => {
    expect(getAttendanceDisplay(present)).toBe(1);
    expect(getAttendanceDisplay(absent)).toBe(0);
    expect(getAttendanceDisplay(partial)).toBe(0.5);
  });

  it("maps present/absent/partial to labels", () => {
    expect(getAttendanceLabel(present)).toBe("Present");
    expect(getAttendanceLabel(absent)).toBe("Absent");
    expect(getAttendanceLabel(partial)).toBe("0.5");
  });

  it("maps present/absent/partial to badge classes", () => {
    expect(getBadgeClass(present)).toBe("badge-present");
    expect(getBadgeClass(absent)).toBe("badge-absent");
    expect(getBadgeClass(partial)).toBe("badge-partial");
  });
});

describe("sortWorkColumns", () => {
  it("sorts by workType priority bed < paper < mesh", () => {
    const columns = [
      { id: "m", name: "Mesh", workType: "mesh" },
      { id: "b", name: "Bed", workType: "bed" },
      { id: "p", name: "Paper", workType: "paper" },
    ];
    expect(sortWorkColumns(columns).map((c) => c.workType)).toEqual([
      "bed",
      "paper",
      "mesh",
    ]);
  });

  it("sorts unknown workTypes last", () => {
    const columns = [
      { id: "x", name: "Other", workType: "other" },
      { id: "b", name: "Bed", workType: "bed" },
    ];
    expect(sortWorkColumns(columns).map((c) => c.workType)).toEqual([
      "bed",
      "other",
    ]);
  });

  it("does not mutate the input array", () => {
    const columns = [
      { id: "m", name: "Mesh", workType: "mesh" },
      { id: "b", name: "Bed", workType: "bed" },
    ];
    const original = [...columns];
    sortWorkColumns(columns);
    expect(columns).toEqual(original);
  });
});
