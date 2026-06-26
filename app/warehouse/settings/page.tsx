import { ControlShell } from "@/components/admin/control-shell";
import { OperationalFeedback } from "@/components/admin/module-panel";
import { WarehouseConfigurationForm } from "@/components/warehouse/warehouse-configuration-form";
import { WarehouseStationSettingsForm } from "@/components/warehouse/warehouse-station-settings-form";
import { connectivityMessage } from "@/lib/platform/copy";
import { getWarehouseSnapshot } from "@/services/admin";
import { getWarehouseConfiguration } from "@/services/warehouse-config";
import { listActiveWarehouses } from "@/services/warehouses";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
}

export default async function WarehouseSettingsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const [snapshot, config, warehouses] = await Promise.all([
    getWarehouseSnapshot({ scope: "settings" }),
    getWarehouseConfiguration(),
    listActiveWarehouses()
  ]);
  const params = searchParams ? await searchParams : {};
  const operationStatus = value(params, "operation_status");
  const operationMessage = value(params, "operation_message");
  const carrierNames = [...new Set(
    snapshot.data.shipments
      .map((shipment) => (typeof shipment.carrier_name === "string" ? shipment.carrier_name.trim() : ""))
      .filter(Boolean)
  )];

  return (
    <ControlShell
      eyebrow="Settings"
      title="Warehouse settings"
      description="Operational defaults for allocation, checkout reservations, labeling, and intake routing."
      actions={[
        { label: "Dashboard", href: "/warehouse/dashboard" },
        { label: "Transfers", href: "/warehouse/transfers" }
      ]}
    >
      <section data-warehouse-settings className="grid gap-6">
        <OperationalFeedback
          status={operationStatus}
          message={operationMessage}
          context="Warehouse settings"
          idle="Configuration save results appear here."
        />

        {snapshot.blockedReason ? (
          <p className="text-sm text-[var(--platform-warning)]">{connectivityMessage(snapshot.blockedReason)}</p>
        ) : null}

        <WarehouseConfigurationForm
          config={config}
          warehouses={warehouses}
          carrierNames={carrierNames.length ? carrierNames : ["Delhivery", "Blue Dart", "DTDC"]}
        />

        <WarehouseStationSettingsForm
          initialCarrierNames={carrierNames.length ? carrierNames : ["Delhivery", "Blue Dart", "DTDC"]}
          serverDefaults={{
            printerName: config.printerName,
            labelWidthMm: config.labelWidthMm,
            barcodePrefix: config.barcodePrefix,
            defaultCarrier: config.defaultCarrier,
            requireItemScan: config.requireItemScan
          }}
        />
      </section>
    </ControlShell>
  );
}
