'use client';

import { useState } from 'react';
import { SchoolAdmin } from '@/types';
import { createSchoolAdminAction } from '@/app/actions/create-school-admin.action';
import { deleteAdminUserAction } from '@/app/actions/delete-admin-user.action';

interface AdminsManagerProps {
  schoolId: string;
  initialAdmins: SchoolAdmin[];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function AdminsManager({ schoolId, initialAdmins }: AdminsManagerProps) {
  const [admins, setAdmins] = useState<SchoolAdmin[]>(initialAdmins);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setFormError(null);

    const result = await createSchoolAdminAction({
      ...form,
      schoolId,
    });

    if (result.success && result.admin) {
      setAdmins((prev) => [...prev, result.admin!]);
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
    } else {
      setFormError(result.error ?? 'Erro desconhecido');
    }

    setIsCreating(false);
  };

  const handleDelete = async (userId: string) => {
    setDeletingId(userId);
    setDeleteError(null);

    const result = await deleteAdminUserAction(userId);

    if (result.success) {
      setAdmins((prev) => prev.filter((a) => a.id !== userId));
    } else {
      setDeleteError(result.error ?? 'Erro desconhecido');
    }

    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administradores</h1>
          <p className="text-gray-600 mt-1">
            {admins.length}{' '}
            {admins.length === 1 ? 'administrador' : 'administradores'} nesta
            escola
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setFormError(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          {showForm ? 'Cancelar' : '+ Novo administrador'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 max-w-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Novo administrador
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@escola.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={isCreating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Criando...' : 'Criar administrador'}
            </button>
          </form>
        </div>
      )}

      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {deleteError}
        </div>
      )}

      {admins.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">
            Nenhum administrador cadastrado ainda.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cadastrado em
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {admin.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {admin.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(admin.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {confirmDeleteId === admin.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-600">Confirmar?</span>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          disabled={deletingId === admin.id}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === admin.id ? '...' : 'Sim'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(admin.id)}
                        className="px-3 py-1 text-red-600 border border-red-200 rounded text-xs hover:bg-red-50 transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
