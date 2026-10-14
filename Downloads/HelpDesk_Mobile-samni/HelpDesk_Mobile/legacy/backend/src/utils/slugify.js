// "AC/Refrigeration Repair" -> "ac-refrigeration-repair"
const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

module.exports = slugify;
