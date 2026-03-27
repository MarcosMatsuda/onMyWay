interface ConnectionHeaderProps {
  isConnected: boolean;
  lastUpdatedAt: Date | null;
}

export default function ConnectionHeader({
  isConnected,
  lastUpdatedAt,
}: ConnectionHeaderProps) {
  const formatTime = (date: Date | null): string => {
    if (!date) return 'Atualizando...';
    return `Atualizado às ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
  };

  return (
    <div className="mb-6 flex items-center gap-4">
      <span className="text-sm font-medium">
        {isConnected ? '🟢 Ao vivo' : '🔴 Desconectado'}
      </span>
      <span className="text-sm text-gray-600">{formatTime(lastUpdatedAt)}</span>
    </div>
  );
}
