"use client";

import { useState } from "react";
import { Load, LoadStatus } from "@/types";
import { X } from "lucide-react";

interface AddLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLoad: (load: Omit<Load, "id" | "createdAt" | "updatedAt">) => void;
}

const vehicleTypes = ["Van", "Truck", "Carreta", "Bitruck", "Toco"];

export function AddLoadModal({ isOpen, onClose, onAddLoad }: AddLoadModalProps) {
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    vehicleType: "Truck",
    freightValue: "",
    description: "",
    status: "available" as LoadStatus,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedFreightValue = Number(formData.freightValue);

    if (!formData.origin || !formData.destination || Number.isNaN(parsedFreightValue) || parsedFreightValue <= 0) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    onAddLoad({
      origin: formData.origin,
      destination: formData.destination,
      vehicleType: formData.vehicleType,
      freightValue: parsedFreightValue,
      description: formData.description,
      status: formData.status,
    });

    // Reset form
    setFormData({
      origin: "",
      destination: "",
      vehicleType: "Truck",
      freightValue: "",
      description: "",
      status: "available",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 flex items-center justify-between bg-primary-600 text-white p-6 border-b">
          <h2 className="text-xl font-bold">Adicionar Nova Carga</h2>
          <button
            onClick={onClose}
            className="hover:bg-primary-700 p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Origin */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Origem *
            </label>
            <input
              type="text"
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              placeholder="ex: São Paulo - SP"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Destino *
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="ex: Rio de Janeiro - RJ"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Veículo
            </label>
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Freight Value */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Valor do Frete (R$) *
            </label>
            <input
              type="number"
              name="freightValue"
              value={formData.freightValue}
              onChange={handleChange}
              placeholder="ex: 2500.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status inicial
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="available">Disponível</option>
              <option value="negotiating">Em Negociação</option>
              <option value="scheduled">Programada</option>
              <option value="completed">Concluída</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Observações sobre a carga..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
            >
              Adicionar Carga
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
