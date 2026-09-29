export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "article";
}

export function entitySlug(name: string, id: string) {
  return `${slugify(name)}-${id.replace(/[^a-z0-9]/gi, "").slice(0, 6).toLowerCase()}`;
}
