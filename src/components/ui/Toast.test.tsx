import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { notify, toast, useToastStore } from '../../notifications/store';
import { useAuthStore } from '../../store/useAuthStore';
import { ToastViewport } from './Toast';

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;
const Wrap = () => (
  <MemoryRouter initialEntries={['/booking']}>
    <ToastViewport />
    <Routes>
      <Route path="*" element={<Where />} />
    </Routes>
  </MemoryRouter>
);
const items = () => useToastStore.getState().items;

beforeEach(() => {
  vi.useFakeTimers();
  useToastStore.getState().clear();
  useAuthStore.setState({ user: { id: '1', fullName: 'A', phoneNumber: '', email: '', role: 'Customer', status: 'Active', emailVerified: true } });
});
afterEach(() => {
  useToastStore.getState().clear();
  useAuthStore.setState({ user: null });
  vi.useRealTimers();
});

describe('ToastViewport', () => {
  it('renders title, text and "Xem" link', () => {
    notify('ORDER_ACCEPTED', { orderId: '7', orderCode: 'MM01' });
    render(<Wrap />);
    expect(screen.getByText('Đơn đã có tài xế')).toBeInTheDocument();
    expect(screen.getByText('Tài xế đã nhận đơn MM01 và đang đến điểm lấy hàng.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xem' })).toHaveAttribute('href', '/orders/7');
  });

  it('has no "Xem" link when the toast has no destination', () => {
    toast.info('Chỉ một dòng');
    render(<Wrap />);
    expect(screen.getByText('Chỉ một dòng')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Xem' })).toBeNull();
  });

  it('error toast has role=alert, others are in an aria-live=polite region', () => {
    toast.error('Lỗi rồi');
    toast.info('Thông tin');
    render(<Wrap />);
    expect(screen.getByRole('alert')).toHaveTextContent('Lỗi rồi');
    const region = screen.getByText('Thông tin').closest('[aria-live="polite"]');
    expect(region).not.toBeNull();
    expect(region).not.toBe(screen.getByRole('alert'));
  });

  it('click close button dismisses', () => {
    toast.info('Đóng tôi');
    render(<Wrap />);
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(items()).toHaveLength(0);
    expect(screen.queryByText('Đóng tôi')).toBeNull();
  });

  it('mouseenter pauses, mouseleave resumes', () => {
    toast.success('Giữ lại');
    render(<Wrap />);
    const card = screen.getByText('Giữ lại').closest('[data-toast]') as HTMLElement;
    fireEvent.mouseEnter(card);
    act(() => void vi.advanceTimersByTime(20_000));
    expect(items()).toHaveLength(1);
    fireEvent.mouseLeave(card);
    act(() => void vi.advanceTimersByTime(4000));
    expect(items()).toHaveLength(0);
  });

  it('clicking "Xem" navigates and dismisses', () => {
    notify('ORDER_ACCEPTED', { orderId: '7', orderCode: 'MM01' });
    render(<Wrap />);
    expect(screen.getByTestId('where')).toHaveTextContent('/booking');
    fireEvent.click(screen.getByRole('link', { name: 'Xem' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/orders/7');
    expect(items()).toHaveLength(0);
  });
});
