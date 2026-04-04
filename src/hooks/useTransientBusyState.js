import { useEffect, useRef, useState } from "react";

export default function useTransientBusyState(duration = 320) {
  const timeoutRef = useRef(null);
  const [activeKey, setActiveKey] = useState(null);

  const clearBusy = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setActiveKey(null);
  };

  const markBusy = (key = true) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setActiveKey(key);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setActiveKey(null);
    }, duration);
  };

  useEffect(() => clearBusy, []);

  return {
    activeKey,
    markBusy,
    clearBusy,
  };
}
