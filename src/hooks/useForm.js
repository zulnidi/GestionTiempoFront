import { useState } from 'react';
import { validate } from '../lib/validation';

/** Estado de formulario con validación local y manejo del error de envío. */
export function useForm({ initialValues, schema = {}, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
    setErrors((e) => (e[name] ? { ...e, [name]: '' } : e));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(schema, values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit(values);
    } catch (err) {
      setFormError(err.message || 'No se pudo completar la acción');
    } finally {
      setSubmitting(false);
    }
  };

  return { values, setValues, errors, submitting, formError, handleChange, handleSubmit };
}
