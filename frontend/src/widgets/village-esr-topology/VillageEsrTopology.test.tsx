import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { EsrRecord, SensorComm } from "@/entities/hierarchy";
import { VillageEsrTopology } from "./VillageEsrTopology";

const live: SensorComm = { connected: true, online: true, in0To72: true, over72: false };

const esr = (name: string, chlorine: number): EsrRecord =>
  ({
    key: `1|Village|${name}`,
    esrName: name,
    water: { latest: 50000 },
    chlorine: { latest: chlorine },
    pressure: { latest: 9 },
    comm: { flow: live, chlorine: live, pressure: live },
  }) as EsrRecord;

const renderTree = (esrs: EsrRecord[]) =>
  render(
    <MemoryRouter>
      <VillageEsrTopology villageName="Village" esrs={esrs} />
    </MemoryRouter>
  );

describe("VillageEsrTopology", () => {
  it("draws one branch and sensor panel per reservoir", () => {
    renderTree([esr("ESR A", 0.3), esr("ESR B", 0.1), esr("MBR C", 0.7), esr("GSR D", 0.4)]);

    const items = within(screen.getByRole("list", { name: "Reservoirs in Village" })).getAllByRole(
      "listitem"
    );
    expect(items).toHaveLength(4);
    // Each reservoir colours its own dots.
    const chlorine = items.map((li) =>
      within(li).getByRole("img", { name: /Chlorine/ }).getAttribute("data-health")
    );
    expect(chlorine).toEqual(["ok", "warn", "bad", "ok"]);
  });

  it("says so when the village has no reservoirs", () => {
    renderTree([]);
    expect(screen.getByText("No reservoirs reported")).toBeInTheDocument();
  });
});
