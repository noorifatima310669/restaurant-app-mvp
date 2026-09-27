import { useCallback, useMemo, useState } from 'react';

export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const handleSubmit = useCallback((onValid) => async () => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) await onValid(values);
  }, [validate, values]);

  const reset = useCallback((nextValues = initialValues) => {
    setValues(nextValues);
    setErrors({});
  }, [initialValues]);

  const isValid = useMemo(() => Object.keys(validate(values)).length === 0, [validate, values]);
  return { values, errors, handleChange, handleSubmit, reset, isValid };
}
