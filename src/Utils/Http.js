export async function readError(response, fallback) {
  const text = await response.text();
  let message = `${fallback} (${response.status})`;
  try {
    const body = JSON.parse(text);
    if (body.errors) message = Object.values(body.errors).flat().join(" ");
    else message = body.message ?? body.title ?? message;
  } catch {}
  return message;
}