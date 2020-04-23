const entityMap: any = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
};

export function escapeHtml(source: string) {
  return String(source).replace(/[&<>"'\/]/g, (s) => entityMap[s]);
}
