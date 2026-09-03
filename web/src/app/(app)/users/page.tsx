'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Shield, Trash2, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { api, Paginated } from '@/lib/api';
import { PROTECTED_ADMIN_USERNAME } from '@/lib/audit-labels';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ModulePageHero } from '@/components/ui/module-page-hero';
import { PermissionMatrix } from '@/components/users/permission-matrix';

type Role = { id: string; name: string; nameAr: string; permissions?: string[] };
type User = {
  id: string;
  username: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  roleId: string;
  role: Role;
  permissions?: string[];
};

type FormState = {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  isActive: boolean;
  permissions: string[];
};

const emptyForm = (roleId = '', permissions: string[] = []): FormState => ({
  username: '',
  password: '',
  email: '',
  firstName: '',
  lastName: '',
  roleId,
  isActive: true,
  permissions,
});

export default function UsersPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const canRead = useAuthStore((s) => s.hasPermission('USERS_READ'));
  const canWrite = useAuthStore((s) => s.hasPermission('USERS_WRITE'));
  const isAdmin = currentUser?.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get<Role[]>('/users/roles')).data,
    enabled: canRead,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: async () =>
      (await api.get<Paginated<User>>('/users', { params: { search, limit: 100 } })).data,
    enabled: canRead,
  });

  const defaultRoleId = roles[0]?.id ?? '';

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        roleId: form.roleId,
        isActive: form.isActive,
        permissions: form.permissions,
        ...(form.password ? { password: form.password } : {}),
      };
      if (modal === 'edit' && editUser) {
        return api.patch(`/users/${editUser.id}`, body);
      }
      if (!form.password || form.password.length < 6) {
        throw new Error('كلمة المرور 6 أحرف على الأقل');
      }
      return api.post('/users', { ...body, password: form.password });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
      setModal(null);
      setEditUser(null);
      toast.success('تم حفظ المستخدم');
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? e.message ?? 'حدث خطأ');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}/active`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
      toast.success('تم تحديث الحالة');
    },
    onError: () => toast.error('تعذر تحديث الحالة'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
      setConfirmDelete(null);
      toast.success('تم حذف المستخدم');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'تعذر الحذف');
    },
  });

  const filtered = useMemo(() => data?.items ?? [], [data?.items]);

  function openCreate() {
    setEditUser(null);
    const role = roles.find((r) => r.id === defaultRoleId);
    setForm(emptyForm(defaultRoleId, role?.permissions ?? []));
    setModal('create');
  }

  function openEdit(u: User) {
    setEditUser(u);
    const held = u.permissions?.length ? u.permissions : (u.role.permissions ?? []);
    setForm({
      username: u.username,
      password: '',
      email: u.email ?? '',
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      roleId: u.roleId,
      isActive: u.isActive,
      permissions: held,
    });
    setModal('edit');
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  if (!canRead) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        ليس لديك صلاحية عرض المستخدمين.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModulePageHero
        gradient="from-slate-800 via-slate-700 to-zinc-600"
        icon={<Shield className="h-7 w-7 text-white" />}
        title="إدارة المستخدمين"
        subtitle="إضافة وتعديل الحسابات وتحديد الأدوار والصلاحيات"
        actions={
          canWrite ? (
            <Button type="button" className="bg-white/20 text-white hover:bg-white/30" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              مستخدم جديد
            </Button>
          ) : null
        }
      />

      <Card>
        <div className="mb-4">
          <Input
            placeholder="بحث بالاسم أو اسم المستخدم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-stone-50 dark:bg-stone-800/50">
                <th className="px-3 py-3 text-right">المستخدم</th>
                <th className="px-3 py-3 text-right">الدور</th>
                <th className="px-3 py-3 text-right">الحالة</th>
                {canWrite ? <th className="px-3 py-3 text-right">إجراءات</th> : null}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-500">
                    لا يوجد مستخدمون
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isProtected = u.username === PROTECTED_ADMIN_USERNAME;
                  return (
                    <tr key={u.id} className="border-b hover:bg-stone-50/80 dark:hover:bg-stone-800/30">
                      <td className="px-3 py-3">
                        <p className="font-bold">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-stone-500" dir="ltr">
                          @{u.username}
                          {isProtected ? (
                            <span className="mr-2 rounded bg-violet-100 px-1.5 py-0.5 text-violet-800">
                              مدير رئيسي
                            </span>
                          ) : null}
                        </p>
                      </td>
                      <td className="px-3 py-3">{u.role.nameAr}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-bold',
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600',
                          )}
                        >
                          {u.isActive ? 'نشط' : 'معطّل'}
                        </span>
                      </td>
                      {canWrite ? (
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {!isProtected ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={u.isActive ? 'تعطيل' : 'تفعيل'}
                                  onClick={() => {
                                    if (
                                      !u.isActive ||
                                      confirm(
                                        `تعطيل المستخدم ${u.username}؟`,
                                      )
                                    ) {
                                      toggleActiveMutation.mutate({
                                        id: u.id,
                                        isActive: !u.isActive,
                                      });
                                    }
                                  }}
                                >
                                  {u.isActive ? (
                                    <UserX className="h-4 w-4 text-amber-600" />
                                  ) : (
                                    <UserCheck className="h-4 w-4 text-emerald-600" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setConfirmDelete(u)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[92vh] w-full max-w-4xl overflow-y-auto">
            <h2 className="mb-4 text-lg font-bold">
              {modal === 'create' ? 'مستخدم جديد' : 'تعديل مستخدم'}
            </h2>
            <form onSubmit={onSubmit} className="space-y-3">
              <Input
                label="اسم المستخدم"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                disabled={editUser?.username === PROTECTED_ADMIN_USERNAME}
                dir="ltr"
              />
              <Input
                label={modal === 'create' ? 'كلمة المرور' : 'كلمة مرور جديدة (اختياري)'}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={modal === 'create'}
                dir="ltr"
              />
              <Input
                label="البريد"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                dir="ltr"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="الاسم"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
                <Input
                  label="اللقب"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">الدور / مستوى الوصول</label>
                <select
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 dark:border-stone-600 dark:bg-stone-900"
                  value={form.roleId}
                  onChange={(e) => {
                    const roleId = e.target.value;
                    const role = roles.find((r) => r.id === roleId);
                    setForm({ ...form, roleId, permissions: role?.permissions ?? form.permissions });
                  }}
                  disabled={editUser?.username === PROTECTED_ADMIN_USERNAME}
                  required
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nameAr} ({r.name})
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  disabled={editUser?.username === PROTECTED_ADMIN_USERNAME}
                />
                حساب نشط
              </label>
              <div className="border-t border-[var(--app-border)] pt-3">
                <p className="mb-2 text-sm font-black">مصفوفة الصلاحيات</p>
                <p className="mb-3 text-xs text-[var(--app-text-dim)]">
                  الصلاحيات مستقلة عن الدور. يمكن منح وصول مختلف للمعصرة وبيع الزيت لنفس المستخدم.
                </p>
                <PermissionMatrix
                  value={form.permissions}
                  onChange={(permissions) => setForm({ ...form, permissions })}
                  disabled={editUser?.username === PROTECTED_ADMIN_USERNAME}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" loading={saveMutation.isPending}>
                  حفظ
                </Button>
                <Button type="button" variant="secondary" onClick={() => setModal(null)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-sm">
            <h3 className="font-bold text-red-700">تأكيد الحذف</h3>
            <p className="mt-2 text-sm text-stone-600">
              حذف المستخدم <strong>{confirmDelete.username}</strong>؟ هذا الإجراء لا يمكن
              التراجع عنه.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="danger"
                className="flex-1"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
              >
                حذف نهائي
              </Button>
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
                إلغاء
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
