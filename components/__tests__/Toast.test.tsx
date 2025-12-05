/**
 * Toast Component Tests
 */

import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Toast } from '../Toast';

describe('Toast', () => {
  it('renders toast message when visible', () => {
    render(
      <Toast
        message="Test message"
        type="info"
        visible={true}
      />
    );

    expect(screen.getByText('Test message')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <Toast
        message="Test message"
        type="info"
        visible={false}
      />
    );

    // Initially not visible
    expect(queryByText('Test message')).toBeNull();
  });

  it('renders success toast with correct icon', () => {
    render(
      <Toast
        message="Success message"
        type="success"
        visible={true}
      />
    );

    expect(screen.getByText('Success message')).toBeTruthy();
    expect(screen.getByText('✓')).toBeTruthy();
  });

  it('renders error toast with correct icon', () => {
    render(
      <Toast
        message="Error message"
        type="error"
        visible={true}
      />
    );

    expect(screen.getByText('Error message')).toBeTruthy();
    expect(screen.getByText('✕')).toBeTruthy();
  });

  it('renders warning toast with correct icon', () => {
    render(
      <Toast
        message="Warning message"
        type="warning"
        visible={true}
      />
    );

    expect(screen.getByText('Warning message')).toBeTruthy();
    expect(screen.getByText('⚠')).toBeTruthy();
  });

  it('renders info toast with correct icon', () => {
    render(
      <Toast
        message="Info message"
        type="info"
        visible={true}
      />
    );

    expect(screen.getByText('Info message')).toBeTruthy();
    expect(screen.getByText('ℹ')).toBeTruthy();
  });
});
