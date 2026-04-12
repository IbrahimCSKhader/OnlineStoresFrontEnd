export default function QuantityStepper({
  value = 1,
  min = 1,
  max,
  disabled = false,
  onChange,
}) {
  const decrementDisabled = disabled || value <= min;
  const incrementDisabled =
    disabled || (typeof max === "number" && value >= max);

  const updateValue = (nextValue) => {
    if (!Number.isFinite(nextValue)) return;
    if (nextValue < min) return;
    if (typeof max === "number" && nextValue > max) return;
    onChange?.(nextValue);
  };

  return (
    <div className="app-quantity">
      <button
        type="button"
        className="app-quantity__button"
        onClick={() => updateValue(value - 1)}
        disabled={decrementDisabled}
        aria-label="تقليل الكمية"
      >
        -
      </button>
      <span className="app-quantity__value">{value}</span>
      <button
        type="button"
        className="app-quantity__button"
        onClick={() => updateValue(value + 1)}
        disabled={incrementDisabled}
        aria-label="زيادة الكمية"
      >
        +
      </button>
    </div>
  );
}
