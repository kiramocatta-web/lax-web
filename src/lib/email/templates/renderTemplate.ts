export function renderTemplate(
  html: string,
  values: Record<string, string | number | null | undefined>
) {
  let output = html;

  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{{${key}}}`, String(value ?? "—"));
  }

  return output;
}