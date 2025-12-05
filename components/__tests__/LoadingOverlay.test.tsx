/**
 * LoadingOverlay Component Tests
 */

import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { LoadingOverlay } from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders loading message when visible', () => {
    render(
      <LoadingOverlay
        visible={true}
        message="Loading data..."
      />
    );

    expect(screen.getByText('Loading data...')).toBeTruthy();
  });

  it('renders default loading message when no message provided', () => {
    render(
      <LoadingOverlay visible={true} />
    );

    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <LoadingOverlay
        visible={false}
        message="Loading data..."
      />
    );

    expect(queryByText('Loading data...')).toBeNull();
  });
});
