import { Search, X } from "lucide-react";
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar por nombre…",
  label = "Buscar registros",
}) {
  return (
    <div className="search-input">
      <Search size={17} />
      <input
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => onChange("")}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
