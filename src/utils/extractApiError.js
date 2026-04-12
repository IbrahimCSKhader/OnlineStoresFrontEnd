function flattenValidationObject(validationObject) {
  if (!validationObject || typeof validationObject !== "object") {
    return "";
  }

  const firstEntry = Object.values(validationObject).find((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return typeof value === "string" && value.trim();
  });

  if (Array.isArray(firstEntry) && firstEntry.length > 0) {
    return firstEntry[0];
  }

  if (typeof firstEntry === "string" && firstEntry.trim()) {
    return firstEntry;
  }

  return "";
}

export default function extractApiError(error, fallback = "Request failed") {
  const data = error?.response?.data;

  if (!data) {
    if (typeof error?.message === "string" && error.message.trim()) {
      return error.message;
    }

    return "Network error";
  }

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (data.errors && typeof data.errors === "object") {
    const firstMessage = flattenValidationObject(data.errors);

    if (firstMessage) {
      return firstMessage;
    }
  }

  const modelStateMessage = flattenValidationObject(
    data.ModelState || data.modelState,
  );

  if (modelStateMessage) {
    return modelStateMessage;
  }

  if (typeof data.title === "string" && data.title.trim()) {
    return data.title;
  }

  return fallback;
}
