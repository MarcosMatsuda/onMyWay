import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SchoolSettingsForm } from '../SchoolSettingsForm';
import { updateSchoolConfigAction } from '@/app/actions/update-school-config.action';

jest.mock('@/app/actions/update-school-config.action', () => ({
  updateSchoolConfigAction: jest.fn(),
}));

describe('SchoolSettingsForm', () => {
  const mockUpdateSchoolConfigAction = updateSchoolConfigAction as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with default values', () => {
    render(<SchoolSettingsForm schoolId="school-123" initialGeofenceRadius={500} initialNotificationThreshold={300} />);

    const geofenceInput = screen.getByLabelText(/raio do geofence/i);
    const notificationInput = screen.getByLabelText(/distância para notificação/i);

    expect(geofenceInput).toHaveValue(500);
    expect(notificationInput).toHaveValue(300);
  });

  it('renders submit button', () => {
    render(<SchoolSettingsForm schoolId="school-123" initialGeofenceRadius={500} initialNotificationThreshold={300} />);

    const submitButton = screen.getByRole('button', {
      name: /salvar configurações/i,
    });
    expect(submitButton).toBeInTheDocument();
  });

  it('shows validation error for geofence radius below minimum', async () => {
    render(<SchoolSettingsForm schoolId="school-123" initialGeofenceRadius={500} initialNotificationThreshold={300} />);

    const geofenceInput = screen.getByLabelText(/raio do geofence/i);
    const submitButton = screen.getByRole('button', {
      name: /salvar configurações/i,
    });

    fireEvent.change(geofenceInput, { target: { value: '50' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/raio do geofence deve estar entre 100 e 5000 metros/i)
      ).toBeInTheDocument();
    });

    expect(mockUpdateSchoolConfigAction).not.toHaveBeenCalled();
  });

  it('shows validation error for geofence radius above maximum', async () => {
    render(<SchoolSettingsForm schoolId="school-123" initialGeofenceRadius={500} initialNotificationThreshold={300} />);

    const geofenceInput = screen.getByLabelText(/raio do geofence/i);
    const submitButton = screen.getByRole('button', {
      name: /salvar configurações/i,
    });

    fireEvent.change(geofenceInput, { target: { value: '6000' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/raio do geofence deve estar entre 100 e 5000 metros/i)
      ).toBeInTheDocument();
    });

    expect(mockUpdateSchoolConfigAction).not.toHaveBeenCalled();
  });

  it('shows validation error for notification threshold below minimum', async () => {
    render(<SchoolSettingsForm schoolId="school-123" initialGeofenceRadius={500} initialNotificationThreshold={300} />);

    const notificationInput = screen.getByLabelText(/distância para notificação/i);
    const submitButton = screen.getByRole('button', {
      name: /salvar configurações/i,
    });

    fireEvent.change(notificationInput, { target: { value: '50' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/distância de notificação deve estar entre 100 e 2000 metros/i)
      ).toBeInTheDocument();
    });

    expect(mockUpdateSchoolConfigAction).not.toHaveBeenCalled();
  });

  it('shows validation error for notification threshold above maximum', async () => {
    render(<SchoolSettingsForm schoolId="school-123" initialGeofenceRadius={500} initialNotificationThreshold={300} />);

    const notificationInput = screen.getByLabelText(/distância para notificação/i);
    const submitButton = screen.getByRole('button', {
      name: /salvar configurações/i,
    });

    fireEvent.change(notificationInput, { target: { value: '2500' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/distância de notificação deve estar entre 100 e 2000 metros/i)
      ).toBeInTheDocument();
    });

    expect(mockUpdateSchoolConfigAction).not.toHaveBeenCalled();
  });

  it('submits form with valid values', async () => {
    mockUpdateSchoolConfigAction.mockResolvedValue({
      success: true,
      data: {
        geofenceRadiusMeters: 1000,
        notificationThresholdMeters: 500,
      },
    });

    render(<SchoolSettingsForm schoolId="school-123" initialGeofenceRadius={500} initialNotificationThreshold={300} />);

    const geofenceInput = screen.getByLabelText(/raio do geofence/i);
    const notificationInput = screen.getByLabelText(/distância para notificação/i);
    const submitButton = screen.getByRole('button', {
      name: /salvar configurações/i,
    });

    fireEvent.change(geofenceInput, { target: { value: '1000' } });
    fireEvent.change(notificationInput, { target: { value: '500' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateSchoolConfigAction).toHaveBeenCalledWith('school-123', {
        geofenceRadiusMeters: 1000,
        notificationThresholdMeters: 500,
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(/configurações atualizadas com sucesso!/i)
      ).toBeInTheDocument();
    });
  });

  it('shows error message on submission failure', async () => {
    mockUpdateSchoolConfigAction.mockResolvedValue({
      success: false,
      error: 'Erro no servidor',
    });

    render(<SchoolSettingsForm schoolId="school-123" initialGeofenceRadius={500} initialNotificationThreshold={300} />);

    const submitButton = screen.getByRole('button', {
      name: /salvar configurações/i,
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/erro no servidor/i)).toBeInTheDocument();
    });
  });

  it('disables inputs and button during submission', async () => {
    mockUpdateSchoolConfigAction.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<SchoolSettingsForm schoolId="school-123" initialGeofenceRadius={500} initialNotificationThreshold={300} />);

    const geofenceInput = screen.getByLabelText(/raio do geofence/i);
    const notificationInput = screen.getByLabelText(/distância para notificação/i);
    const submitButton = screen.getByRole('button', {
      name: /salvar configurações/i,
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(geofenceInput).toBeDisabled();
      expect(notificationInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/salvando.../i)).toBeInTheDocument();
    });
  });
});
