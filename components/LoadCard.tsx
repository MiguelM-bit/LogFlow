"use client";

import { Load } from "@/types";
import { MessageCircle, Truck, MapPin } from "lucide-react";
import { useState } from "react";

interface LoadCardProps {
  load: Load;
  onWhatsAppClick?: (load: Load) => void;
  onDragStart?: (loadId: string) => void;
  onMoveToNextStatus?: (load: Load) => void;
  isUpdating?: boolean;
}

export function LoadCard({
  load,
  onWhatsAppClick,
  onDragStart,
  onMoveToNextStatus,
  isUpdating = false,
}: LoadCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const generateWhatsAppMessage = (load: Load) => {
    return `🚚 *Proposta de Frete - LogFlow*\n\n📍 De: ${load.origin}\n📍 Para: ${load.destination}\n🚐 Veículo: ${load.vehicleType}\n💰 Valor: R$ ${load.freightValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\n${load.description || ""}`;
  };

  const message = generateWhatsAppMessage(load);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-primary-600 cursor-grab active:cursor-grabbing"
      draggable={!isUpdating}
      onDragStart={() => onDragStart?.(load.id)}
    >
      <div className="space-y-3">
        {/* Route */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0 mt-1" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-600 font-medium">ROTA</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {load.origin}
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              → {load.destination}
            </p>
          </div>
        </div>

        {/* Vehicle Type */}
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <span className="text-sm text-gray-700 font-medium">
            {load.vehicleType}
          </span>
        </div>

        {/* Freight Value */}
        <div className="flex items-center justify-between bg-primary-50 px-3 py-2 rounded">
          <span className="text-xs text-gray-600 font-medium">VALOR</span>
          <span className="text-lg font-bold text-primary-700">
            R$ {load.freightValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Description */}
        {load.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {load.description}
          </p>
        )}

        {/* WhatsApp Button */}
        <button
          disabled={isUpdating}
          onClick={() => {
            onWhatsAppClick?.(load);
            window.open(whatsappUrl, "_blank");
          }}
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-xs font-semibold py-2 px-3 rounded transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Resumo WhatsApp
        </button>

        {/* Next Status Button */}
        {load.status !== "completed" && (
          <button
            disabled={isUpdating}
            onClick={() => onMoveToNextStatus?.(load)}
            className="w-full text-xs font-semibold py-2 px-3 rounded border border-primary-200 text-primary-700 hover:bg-primary-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          >
            {isUpdating ? "Atualizando..." : "Avançar Status"}
          </button>
        )}

        {/* Preview Button */}
        <button
          disabled={isUpdating}
          onClick={() => setShowPreview(!showPreview)}
          className="w-full text-xs text-primary-600 hover:text-primary-700 disabled:text-gray-400 font-medium py-1 underline"
        >
          {showPreview ? "Ocultar" : "Ver"} Mensagem
        </button>

        {/* Message Preview */}
        {showPreview && (
          <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
