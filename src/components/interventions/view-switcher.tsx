"use client";

import { LayoutGrid, Table } from "lucide-react";

export type ViewMode = "detailed" | "table";

interface ViewSwitcherProps {
  value: ViewMode;
  onValueChange: (mode: ViewMode) => void;
}

export function ViewSwitcher({ value, onValueChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center border border-gray-200 rounded-md">
      <button
        onClick={() => onValueChange("detailed")}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-l-md transition-colors ${
          value === "detailed"
            ? "bg-blue-50 text-blue-700 border-r border-blue-200"
            : "text-gray-500 hover:text-gray-700 border-r border-gray-200"
        }`}
      >
        <LayoutGrid className="w-4 h-4 mr-2" />
        Détaillée
      </button>
      <button
        onClick={() => onValueChange("table")}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-r-md transition-colors ${
          value === "table"
            ? "bg-blue-50 text-blue-700"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <Table className="w-4 h-4 mr-2" />
        Liste
      </button>
    </div>
  );
}