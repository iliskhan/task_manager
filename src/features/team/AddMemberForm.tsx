import { Alert, Button, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';

type AddMemberFormProps = {
  isSubmitting: boolean;
  error: Error | null;
  onSubmit: (email: string) => Promise<void>;
};

const addMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email('Введите корректный email.'),
});

export function AddMemberForm({
  isSubmitting,
  error,
  onSubmit,
}: AddMemberFormProps) {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const result = addMemberSchema.safeParse({ email });

    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? 'Введите корректный email.');
      return;
    }

    setFieldError(null);
    try {
      await onSubmit(result.data.email);
    } catch {
      // The parent mutation owns the displayed error state.
    }
  };

  return (
    <Stack spacing={1.5}>
      {error ? <Alert severity="error">{error.message}</Alert> : null}
      <TextField
        placeholder="Email участника"
        slotProps={{ htmlInput: { 'aria-label': 'Email участника' } }}
        value={email}
        error={Boolean(fieldError)}
        helperText={fieldError ?? ' '}
        onChange={(event) => setEmail(event.target.value)}
        disabled={isSubmitting}
        autoComplete="email"
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={isSubmitting}
        sx={{ alignSelf: 'flex-start' }}
      >
        Добавить участника
      </Button>
    </Stack>
  );
}
