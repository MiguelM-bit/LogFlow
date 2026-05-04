"use client";

import { useMemo, useState } from "react";
import type { CreateLoadDTO, LoadRecord } from "@/app/cargas/types/contracts";

interface LoadFormState {
  origin: string;
  destination: string;
  price: string;
  status: CreateLoadDTO["status"];
  cliente: string;
  perfil: string;
  horarioColeta: string;
  horarioDescarga: string;
}

export interface LoadFormValidation {
  origin?: string;
  destination?: string;
  price?: string;
  cliente?: string;
  perfil?: string;
  horarioColeta?: string;
  horarioDescarga?: string;
}

const INITIAL_FORM: LoadFormState = {
  origin: "",
  destination: "",
  price: "",
  status: "em_aberto",
  cliente: "",
  perfil: "",
  horarioColeta: "",
  horarioDescarga: "",
};

function validate(form: LoadFormState): LoadFormValidation {
  const errors: LoadFormValidation = {};

  if (!form.origin.trim()) {
    errors.origin = "Informe a origem.";
  }

  if (!form.destination.trim()) {
    errors.destination = "Informe o destino.";
  }

  const parsedPrice = Number(form.price.replace(",", "."));
  if (!form.price.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
    errors.price = "Informe um valor de frete válido.";
  }

  return errors;
}

export function useLoadForm(initial?: LoadRecord | null) {
  const [form, setForm] = useState<LoadFormState>(() => {
    if (!initial) {
      return INITIAL_FORM;
    }

    return {
      origin: initial.origin,
      destination: initial.destination,
      price: String(initial.price),
      status: initial.status,
      cliente: initial.cliente ?? "",
      perfil: initial.perfil ?? "",
      horarioColeta: initial.horarioColeta ?? "",
      horarioDescarga: initial.horarioDescarga ?? "",
    };
  });
  const [errors, setErrors] = useState<LoadFormValidation>({});

  const canSubmit = useMemo(() => Object.keys(validate(form)).length === 0, [form]);

  function patch(field: keyof LoadFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof LoadFormValidation]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function reset(nextInitial?: LoadRecord | null) {
    if (nextInitial) {
      setForm({
        origin: nextInitial.origin,
        destination: nextInitial.destination,
        price: String(nextInitial.price),
        status: nextInitial.status,
        cliente: nextInitial.cliente ?? "",
        perfil: nextInitial.perfil ?? "",
        horarioColeta: nextInitial.horarioColeta ?? "",
        horarioDescarga: nextInitial.horarioDescarga ?? "",
      });
      setErrors({});
      return;
    }

    setForm(INITIAL_FORM);
    setErrors({});
  }

  function toDTO(): CreateLoadDTO | null {
    const validation = validate(form);
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      return null;
    }

    return {
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      price: Number(form.price.replace(",", ".")),
      status: form.status,
      cliente: form.cliente.trim() || null,
      perfil: form.perfil.trim() || null,
      horarioColeta: form.horarioColeta || null,
      horarioDescarga: form.horarioDescarga || null,
    };
  }

  return {
    form,
    errors,
    patch,
    reset,
    toDTO,
    canSubmit,
  };
}
