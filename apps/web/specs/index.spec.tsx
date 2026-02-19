import React from 'react';
import { render, screen } from '@testing-library/react';
import Page from '../src/app/page';

describe('HomePage', () => {
  it('should render the landing page', () => {
    render(<Page />);
    expect(screen.getByText('Future Folklore')).toBeTruthy();
    expect(screen.getByText(/frontier science/i)).toBeTruthy();
  });
});
