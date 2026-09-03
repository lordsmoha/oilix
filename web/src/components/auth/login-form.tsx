'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Eye, EyeOff, Lock, LogIn, User } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { resolveApiBaseUrl } from '@/lib/api-url';
import { useAuthStore, type AuthUser } from '@/lib/auth-store';
import { canAccessWorkspace } from '@/lib/permission-catalog';
import { useWorkspaceStore, workspaceHome } from '@/lib/workspace-store';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get('username'));
    const password = String(fd.get('password'));
    setLoading(true);
    try {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', {
        username,
        password,
      });
      setAuth(data.accessToken, data.user);
      const ws = workspace ?? 'mill';
      if (!canAccessWorkspace(data.user.permissions, ws, data.user.role)) {
        router.replace(`/access-denied?workspace=${ws}`);
        return;
      }
      toast.success('مرحباً بك');
      router.push(workspaceHome(ws));
    } catch (err) {
      const apiUrl = `${resolveApiBaseUrl()}/auth/login`;
      if (axios.isAxiosError(err) && !err.response) {
        toast.error(`تعذر الاتصال بالخادم (${apiUrl}). تحقق من Nginx و pm2.`);
      } else if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast.error('اسم المستخدم أو كلمة المرور غير صحيحة');
      } else if (axios.isAxiosError(err) && err.response?.status === 404) {
        toast.error(`مسار API غير موجود (${apiUrl}) — أعد build الويب على السيرفر`);
      } else if (axios.isAxiosError(err) && err.response?.status === 429) {
        toast.error('تم تجاوز عدد المحاولات — انتظر 15 دقيقة');
      } else if (axios.isAxiosError(err) && (err.response?.status ?? 0) >= 500) {
        toast.error('خطأ في الخادم — راجع pm2 logs oilix-api');
      } else if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        const status = err.response?.status;
        if (typeof msg === 'string') toast.error(msg);
        else if (Array.isArray(msg)) toast.error(msg.join(' · '));
        else toast.error(`تعذر تسجيل الدخول (${status ?? '?'} · ${apiUrl})`);
      } else {
        toast.error('تعذر تسجيل الدخول — خطأ غير متوقع');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="login-form-enter space-y-5">
      <Field
        id="username"
        name="username"
        label="اسم المستخدم"
        icon={User}
        autoComplete="username"
        required
        placeholder="أدخل اسم المستخدم"
      />

      <Field
        id="password"
        name="password"
        label="كلمة المرور"
        icon={Lock}
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        required
        placeholder="أدخل كلمة المرور"
        trailing={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="rounded-lg p-1.5 text-[var(--app-text-dim)] transition hover:bg-[var(--app-bg-muted)] hover:text-[var(--app-text)]"
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'login-submit-btn flex w-full items-center justify-center gap-2 rounded-[var(--app-radius-lg)] px-6 py-3.5 text-base font-bold text-white shadow-[var(--app-shadow-glow)] transition-all duration-200',
          'bg-gradient-to-l from-[var(--app-accent)] to-[var(--app-accent-dark)]',
          'hover:brightness-110 hover:shadow-[var(--app-shadow-lg)]',
          'focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--app-accent)_40%,transparent)] focus:ring-offset-2 focus:ring-offset-[var(--app-bg)]',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <>
            <LogIn className="h-5 w-5" />
            تسجيل الدخول
          </>
        )}
      </button>

      <Link
        href="/"
        className="block text-center text-sm font-bold text-[var(--app-accent)] hover:underline"
      >
        تغيير مساحة العمل
      </Link>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  icon: Icon,
  type = 'text',
  trailing,
  className,
  ...props
}: {
  id: string;
  name: string;
  label: string;
  icon: React.ElementType;
  trailing?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-[var(--app-text-muted)]">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-accent)] opacity-70" />
        <input
          id={id}
          name={name}
          type={type}
          className={cn(
            'w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] py-3 pr-10 pl-10 text-sm text-[var(--app-text)] shadow-sm transition-all duration-200',
            'placeholder:text-[var(--app-text-dim)]',
            'hover:border-[color-mix(in_srgb,var(--app-accent)_35%,var(--app-border))]',
            'focus:border-[var(--app-accent)] focus:bg-[var(--app-surface)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--app-accent)_25%,transparent)] focus:shadow-[var(--app-shadow-md)]',
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
    </div>
  );
}
