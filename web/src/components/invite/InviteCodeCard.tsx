'use client';

import { useState } from 'react';
import { regenerateInviteAction } from '@/app/actions/regenerate-invite.action';

interface InviteCodeCardProps {
  schoolId: string;
  initialInviteCode: string;
}

export function InviteCodeCard({ schoolId, initialInviteCode }: InviteCodeCardProps) {
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);

    const result = await regenerateInviteAction(schoolId);

    if (result.success && result.inviteCode) {
      setInviteCode(result.inviteCode);
    } else {
      setError(result.error ?? 'Erro desconhecido');
    }

    setIsRegenerating(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">Código de convite</p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-3xl font-bold tracking-widest text-gray-900">
            {inviteCode}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
            title="Copiar código"
          >
            {copied ? '✓' : '⎘'}
          </button>
        </div>
        {copied && <p className="text-sm text-green-600 mt-1">Copiado!</p>}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Compartilhe este código com os pais para que eles possam se cadastrar e
        vincular à sua escola.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleRegenerate}
        disabled={isRegenerating}
        className="w-full px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRegenerating ? 'Regenerando...' : 'Regenerar código'}
      </button>

      <p className="text-xs text-gray-400 mt-2 text-center">
        Atenção: regenerar invalida o código atual.
      </p>
    </div>
  );
}
