import { fireEvent, render } from '@testing-library/react-native';

import { AppointmentCard, EmptyState, StatusPill, TimeSlotGrid } from '../AppUI';

describe('AppUI components', () => {
  it('renders empty states with title and message', async () => {
    const { getByText } = await render(<EmptyState message="Sin datos todavia" title="Agenda vacia" />);

    expect(getByText('Agenda vacia')).toBeTruthy();
    expect(getByText('Sin datos todavia')).toBeTruthy();
  });

  it('renders appointment cards with status and date', async () => {
    const { getByText } = await render(
      <AppointmentCard
        client="Alex"
        date="25 may, 11:00"
        service="Corte clasico"
        status="pending"
      />,
    );

    expect(getByText('Corte clasico')).toBeTruthy();
    expect(getByText('Alex')).toBeTruthy();
    expect(getByText('pending')).toBeTruthy();
  });

  it('notifies when a time slot is selected', async () => {
    const onSelect = jest.fn();
    const { getByText } = await render(<TimeSlotGrid onSelect={onSelect} selected="09:00" slots={['09:00', '10:00']} />);

    fireEvent.press(getByText('10:00'));

    expect(onSelect).toHaveBeenCalledWith('10:00');
  });

  it('renders status pills for appointment state', async () => {
    const { getByText } = await render(<StatusPill status="confirmed" />);

    expect(getByText('confirmed')).toBeTruthy();
  });
});
