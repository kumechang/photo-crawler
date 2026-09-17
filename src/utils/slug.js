export function slugify(keyword) {
  return keyword
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-');
}
