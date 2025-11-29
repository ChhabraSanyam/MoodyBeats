/**
 * Toast Provider Component
 * Provides toast notification context throughout the app
 * Requirements: Toast notifications for success/error states
 */

import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Toast, ToastType } from './Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [duration, setDuration] = useState(3000);

  const showToast = (
    newMessage: string,
    newType: ToastType = 'info',
    newDuration: number = 3000
  ) => {
    setMessage(newMessage);
    setType(newType);
    setDuration(newDuration);
    setVisible(true);
  };

  const hideToast = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        message={message}
        type={type}
        duration={duration}
        visible={visible}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}
