export function toCSV(data) {
  if (!data.length) return "";
  const headers = Object.keys(data[0]).filter(
    (key) => !["id", "createdAt"].includes(key),
  );
  const escape = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [
    headers.map(escape).join(","),
    ...data.map((row) => headers.map((key) => escape(row[key])).join(",")),
  ].join("\r\n");
}
export function downloadReport(data, filename = "reporte_sanate") {
  const csv = toCSV(data);
  if (!csv) return false;
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
