import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { useLogin } from '@/hooks/useLogin';

jest.mock('@/hooks/useLogin');

describe('LoginForm', () => {
  let mockUseLogin: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLogin = useLogin as jest.Mock;
    mockUseLogin.mockReturnValue({
      login: jest.fn(),
      isLoading: false,
      error: null,
    });
  });

  it('renders email field, password field, and submit button', () => {
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Senha');
    const submitButton = screen.getByRole('button', { name: /Entrar/i });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  it('shows "Entrar" button text when not loading', () => {
    render(<LoginForm />);
    const button = screen.getByRole('button', { name: /Entrar/i });
    expect(button).toHaveTextContent('Entrar');
  });

  it('shows "Entrando..." button text when isLoading=true', () => {
    mockUseLogin.mockReturnValue({
      login: jest.fn(),
      isLoading: true,
      error: null,
    });

    render(<LoginForm />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Entrando...');
  });

  it('disables submit button when isLoading=true', () => {
    mockUseLogin.mockReturnValue({
      login: jest.fn(),
      isLoading: true,
      error: null,
    });

    render(<LoginForm />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables input fields when isLoading=true', () => {
    mockUseLogin.mockReturnValue({
      login: jest.fn(),
      isLoading: true,
      error: null,
    });

    render(<LoginForm />);
    const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('Senha') as HTMLInputElement;

    expect(emailInput.disabled).toBe(true);
    expect(passwordInput.disabled).toBe(true);
  });

  it('displays error message when error is set', () => {
    mockUseLogin.mockReturnValue({
      login: jest.fn(),
      isLoading: false,
      error: 'Email ou senha inválidos',
    });

    render(<LoginForm />);
    const errorMessage = screen.getByText('Email ou senha inválidos');
    expect(errorMessage).toBeInTheDocument();
  });

  it('does not display error message when error is null', () => {
    render(<LoginForm />);
    expect(screen.queryByText(/Email ou senha inválidos/)).not.toBeInTheDocument();
  });

  it('calls login function with email and password when form is submitted', async () => {
    const mockLogin = jest.fn();
    mockUseLogin.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    });

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Senha');
    const submitButton = screen.getByRole('button');

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('triggers form submit when Enter is pressed in email field', async () => {
    const mockLogin = jest.fn();
    mockUseLogin.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    });

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Senha');

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.keyDown(emailInput, { key: 'Enter' });

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('triggers form submit when Enter is pressed in password field', async () => {
    const mockLogin = jest.fn();
    mockUseLogin.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    });

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Senha');

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.keyDown(passwordInput, { key: 'Enter' });

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('does not submit when Enter is pressed while loading', async () => {
    const mockLogin = jest.fn();
    mockUseLogin.mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
    });

    render(<LoginForm />);

    const passwordInput = screen.getByPlaceholderText('Senha');
    fireEvent.keyDown(passwordInput, { key: 'Enter' });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('updates form field values as user types', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('Senha') as HTMLInputElement;

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });
});
