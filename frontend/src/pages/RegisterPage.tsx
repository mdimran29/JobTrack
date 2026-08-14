import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { registerSchema, RegisterFormValues } from '../lib/schemas';
import { getErrorMessage } from '../api/axios';

export const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      await registerUser(values);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not create your account'));
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-lg font-semibold text-text-inverse">Create your account</h1>
      <p className="mt-1 text-[13px] text-ink-400">Start tracking every application in one place.</p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-[13px] font-medium text-ink-300">
            Full name
          </label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jordan Rivera"
            className="!border-ink-600 !bg-ink-800 !text-text-inverse placeholder:!text-ink-500"
            error={errors.name?.message}
            {...register('name')}
          />
          {errors.name && <span className="text-xs text-status-rejected-text">{errors.name.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[13px] font-medium text-ink-300">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="!border-ink-600 !bg-ink-800 !text-text-inverse placeholder:!text-ink-500"
            error={errors.email?.message}
            {...register('email')}
          />
          {errors.email && <span className="text-xs text-status-rejected-text">{errors.email.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[13px] font-medium text-ink-300">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="!border-ink-600 !bg-ink-800 !text-text-inverse placeholder:!text-ink-500"
            error={errors.password?.message}
            {...register('password')}
          />
          {errors.password && (
            <span className="text-xs text-status-rejected-text">{errors.password.message}</span>
          )}
        </div>

        {formError && (
          <div className="rounded-[var(--radius-control)] border border-status-rejected-text/30 bg-status-rejected-text/10 px-3 py-2 text-[13px] text-status-rejected-text">
            {formError}
          </div>
        )}

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="mt-1 !bg-accent-500 !text-ink-950 hover:!bg-accent-300"
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent-500 hover:text-accent-300">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};
