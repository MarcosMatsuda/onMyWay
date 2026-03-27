import React from 'react';
import { render, screen } from '@testing-library/react';
import ConnectionHeader from '../ConnectionHeader';

describe('ConnectionHeader', () => {
  it('shows "Ao vivo" when connected', () => {
    render(<ConnectionHeader isConnected={true} lastUpdatedAt={null} />);
    expect(screen.getByText(/Ao vivo/)).toBeInTheDocument();
  });

  it('shows "Desconectado" when not connected', () => {
    render(<ConnectionHeader isConnected={false} lastUpdatedAt={null} />);
    expect(screen.getByText(/Desconectado/)).toBeInTheDocument();
  });

  it('shows "Atualizando..." when lastUpdatedAt is null', () => {
    render(<ConnectionHeader isConnected={true} lastUpdatedAt={null} />);
    expect(screen.getByText('Atualizando...')).toBeInTheDocument();
  });

  it('shows formatted time when lastUpdatedAt is provided', () => {
    const testDate = new Date('2024-01-15T14:30:45');
    render(<ConnectionHeader isConnected={true} lastUpdatedAt={testDate} />);
    expect(screen.getByText(/Atualizado às/)).toBeInTheDocument();
  });

  it('shows formatted time even when disconnected', () => {
    const testDate = new Date('2024-06-01T09:15:00');
    render(<ConnectionHeader isConnected={false} lastUpdatedAt={testDate} />);
    expect(screen.getByText(/Atualizado às/)).toBeInTheDocument();
    expect(screen.getByText(/Desconectado/)).toBeInTheDocument();
  });
});
