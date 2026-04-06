import { render, screen, fireEvent } from '@testing-library/react';
import ToastStack from './ToastStack';

test('renders toast items and allows dismiss', () => {
  const toasts = [
    { id: '1', type: 'success', title: 'Saved', message: 'Changes stored.' }
  ];
  const onClose = jest.fn();

  render(<ToastStack toasts={toasts} onClose={onClose} />);

  expect(screen.getByText('Saved')).toBeInTheDocument();
  expect(screen.getByText('Changes stored.')).toBeInTheDocument();

  fireEvent.click(screen.getByText('X'));
  expect(onClose).toHaveBeenCalledWith('1');
});
