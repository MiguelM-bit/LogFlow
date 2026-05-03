"use client";

import { useEffect, useMemo, useState } from "react";
import type { CloseLoadAssignmentInput, DriverSummary, VehicleSummary } from "@/app/cargas/types/contracts";
import { searchDrivers, searchVehicles, isValidBrazilPlate } from "@/app/cargas/services/closeLoadService";
import { createClient } from "@/utils/supabase/client";
import { formatCPF, normalizeDocument, validators } from "@/services/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SourceMode = "existing" | "pre";

interface CloseLoadAssignmentDialogProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (payload: CloseLoadAssignmentInput) => Promise<void>;
}

export function CloseLoadAssignmentDialog({
  open,
  loading,
  onClose,
  onConfirm,
}: CloseLoadAssignmentDialogProps) {
  const supabase = useMemo(() => createClient(), []);

  const [driverMode, setDriverMode] = useState<SourceMode>("existing");
  const [vehicleMode, setVehicleMode] = useState<SourceMode>("existing");

  const [driverQuery, setDriverQuery] = useState("");
  const [vehicleQuery, setVehicleQuery] = useState("");

  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);

  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const [preDriverName, setPreDriverName] = useState("");
  const [preDriverCpf, setPreDriverCpf] = useState("");
  const [preVehiclePlate, setPreVehiclePlate] = useState("");

  const [formError, setFormError] = useState<string | null>(null);

  const cpfValid = validators.cpf(normalizeDocument(preDriverCpf));
  const plateValid = isValidBrazilPlate(preVehiclePlate);

  useEffect(() => {
    if (!open || driverMode !== "existing") return;

    const timeout = window.setTimeout(async () => {
      const result = await searchDrivers(supabase, driverQuery);
      if (!result.error) {
        setDrivers(result.data);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [open, driverMode, driverQuery, supabase]);

  useEffect(() => {
    if (!open || vehicleMode !== "existing") return;

    const timeout = window.setTimeout(async () => {
      const result = await searchVehicles(supabase, vehicleQuery);
      if (!result.error) {
        setVehicles(result.data);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [open, vehicleMode, vehicleQuery, supabase]);

  function resetState() {
    setDriverMode("existing");
    setVehicleMode("existing");
    setDriverQuery("");
    setVehicleQuery("");
    setDrivers([]);
    setVehicles([]);
    setSelectedDriverId(null);
    setSelectedVehicleId(null);
    setPreDriverName("");
    setPreDriverCpf("");
    setPreVehiclePlate("");
    setFormError(null);
  }

  async function handleConfirm() {
    const payload: CloseLoadAssignmentInput = {};

    if (driverMode === "existing") {
      if (!selectedDriverId) {
        setFormError("Selecione um motorista cadastrado ou escolha pré-cadastro.");
        return;
      }
      payload.driverId = selectedDriverId;
    } else {
      if (!preDriverName.trim() || !cpfValid) {
        setFormError("Informe um motorista válido (nome e CPF verdadeiro).");
        return;
      }
      payload.preDriver = {
        name: preDriverName.trim(),
        cpf: preDriverCpf,
      };
    }

    if (vehicleMode === "existing") {
      if (!selectedVehicleId) {
        setFormError("Selecione um veículo cadastrado ou escolha pré-cadastro de placa.");
        return;
      }
      payload.vehicleId = selectedVehicleId;
    } else {
      if (!plateValid) {
        setFormError("Informe uma placa válida para pré-cadastro.");
        return;
      }
      payload.preVehicle = {
        plate: preVehiclePlate,
      };
    }

    setFormError(null);
    await onConfirm(payload);
    resetState();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          resetState();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Fechar carga: motorista e veículo</DialogTitle>
          <DialogDescription>
            Para fechar a carga, informe quem será o motorista e qual será o veículo (placa).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Motorista</h3>
            <div className="flex gap-2">
              <Button type="button" variant={driverMode === "existing" ? "default" : "outline"} size="sm" onClick={() => setDriverMode("existing")}>Buscar cadastrado</Button>
              <Button type="button" variant={driverMode === "pre" ? "default" : "outline"} size="sm" onClick={() => setDriverMode("pre")}>Pré-cadastro</Button>
            </div>

            {driverMode === "existing" ? (
              <div className="space-y-2">
                <Input
                  value={driverQuery}
                  onChange={(event) => setDriverQuery(event.target.value)}
                  placeholder="Buscar por nome ou CPF"
                />
                <div className="max-h-40 overflow-auto space-y-1">
                  {drivers.map((driver) => (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => setSelectedDriverId(driver.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${selectedDriverId === driver.id ? "border-primary-500 bg-primary-50" : "border-slate-200"}`}
                    >
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-xs text-slate-500">CPF: {driver.cpf}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  value={preDriverName}
                  onChange={(event) => setPreDriverName(event.target.value)}
                  placeholder="Nome do motorista"
                />
                <Input
                  value={preDriverCpf}
                  onChange={(event) => setPreDriverCpf(formatCPF(event.target.value))}
                  placeholder="CPF"
                />
                {preDriverCpf.trim() && !cpfValid ? (
                  <p className="text-xs text-rose-600">CPF inválido.</p>
                ) : null}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Veículo</h3>
            <div className="flex gap-2">
              <Button type="button" variant={vehicleMode === "existing" ? "default" : "outline"} size="sm" onClick={() => setVehicleMode("existing")}>Buscar cadastrado</Button>
              <Button type="button" variant={vehicleMode === "pre" ? "default" : "outline"} size="sm" onClick={() => setVehicleMode("pre")}>Pré-cadastro de placa</Button>
            </div>

            {vehicleMode === "existing" ? (
              <div className="space-y-2">
                <Input
                  value={vehicleQuery}
                  onChange={(event) => setVehicleQuery(event.target.value)}
                  placeholder="Buscar por placa"
                />
                <div className="max-h-40 overflow-auto space-y-1">
                  {vehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${selectedVehicleId === vehicle.id ? "border-primary-500 bg-primary-50" : "border-slate-200"}`}
                    >
                      <p className="font-medium">{vehicle.plate}</p>
                      <p className="text-xs text-slate-500">{vehicle.type} • {vehicle.category}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  value={preVehiclePlate}
                  onChange={(event) => setPreVehiclePlate(event.target.value.toUpperCase())}
                  placeholder="Placa (ABC1D23 ou ABC1234)"
                />
                {preVehiclePlate.trim() && !plateValid ? (
                  <p className="text-xs text-rose-600">Placa inválida.</p>
                ) : null}
              </div>
            )}
          </section>
        </div>

        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={loading}>
            {loading ? "Fechando..." : "Salvar e fechar carga"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
