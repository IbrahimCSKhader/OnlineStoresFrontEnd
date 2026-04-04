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
    const firstKey = Object.keys(data.errors)[0];
    const firstValue = data.errors[firstKey];

    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return firstValue[0];
    }

    if (typeof firstValue === "string" && firstValue.trim()) {
      return firstValue;
    }
  }

  if (typeof data.title === "string" && data.title.trim()) {
    return data.title;
  }

  return fallback;
}
