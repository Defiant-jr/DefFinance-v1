import { useState, useEffect } from 'react';

const STORAGE_KEY = 'defFinance:emCashValue';

const parseValue = (raw) => {
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const readStoredValue = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 0;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return parseValue(stored);
};

const writeStoredValue = (value) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, String(value ?? 0));
};

export const useEmCashValue = () => {
  const [value, setValue] = useState(() => readStoredValue());

  useEffect(() => {
    writeStoredValue(value);
  }, [value]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === STORAGE_KEY) {
        setValue(readStoredValue());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return [value, setValue];
};

export const getStoredEmCashValue = () => readStoredValue();
