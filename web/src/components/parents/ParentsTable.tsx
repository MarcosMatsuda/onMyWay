'use client';

import { useState } from 'react';
import { SchoolParent } from '@/types';
import { removeParentAction } from '@/app/actions/remove-parent.action';

interface ParentsTableProps {
  schoolId: string;
  initialParents: SchoolParent[];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ParentsTable({ schoolId, initialParents }: ParentsTableProps) {
  const [parents, setParents] = useState<SchoolParent[]>(initialParents);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (parentId: string) => {
    setDeletingId(parentId);
    setError(null);

    const result = await removeParentAction(schoolId, parentId);

    if (result.success) {
      setParents((prev) => prev.filter((p) => p.id !== parentId));
    } else {
      setError(result.error ?? 'Erro desconhecido');
    }

    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  if (parents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-lg">Nenhum pai cadastrado ainda.</p>
        <p className="text-gray-400 text-sm mt-1">
          Compartilhe o código de convite para que pais possam se registrar.
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
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
                Telefone
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Cadastrado em
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {parents.map((parent) => (
              <tr
                key={parent.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {parent.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {parent.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {parent.phone}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(parent.createdAt)}
                </td>
                <td className="px-6 py-4 text-right">
                  {confirmDeleteId === parent.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-gray-600">Confirmar?</span>
                      <button
                        onClick={() => handleDelete(parent.id)}
                        disabled={deletingId === parent.id}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === parent.id ? '...' : 'Sim'}
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
                      onClick={() => setConfirmDeleteId(parent.id)}
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
    </>
  );
}
