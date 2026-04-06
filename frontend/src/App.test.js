import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the home landing headline', async () => {
  render(<App />);
  const headline = await screen.findByText(/Smart Campus Energy Monitoring/i);
  expect(headline).toBeInTheDocument();
});
