export function FilterTabs({
  options,
  value,
  onChange,
  label = "Filtrar registros",
}) {
  return (
    <div className="filter-tabs" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          key={option}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={value === option ? "active" : ""}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
