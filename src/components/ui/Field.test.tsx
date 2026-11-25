import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Field } from './Field';

describe('ô mật khẩu có nút con mắt', () => {
  it('mặc định ẩn mật khẩu; bấm con mắt thì hiện, bấm lần nữa thì ẩn lại', () => {
    render(<Field label="Mật khẩu" type="password" defaultValue="Bi-mat-123" />);
    const input = screen.getByLabelText('Mật khẩu') as HTMLInputElement;
    expect(input.type).toBe('password');

    fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(input.type).toBe('text');
    expect(input.value).toBe('Bi-mat-123'); // nội dung không đổi

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(input.type).toBe('password');
  });

  it('mỗi ô mật khẩu có con mắt riêng (ô nhập lại không hiện theo ô trên)', () => {
    render(
      <>
        <Field label="Mật khẩu" type="password" />
        <Field label="Nhập lại mật khẩu" type="password" />
      </>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Hiện mật khẩu' })[0]);

    expect((screen.getByLabelText('Mật khẩu') as HTMLInputElement).type).toBe('text');
    expect((screen.getByLabelText('Nhập lại mật khẩu') as HTMLInputElement).type).toBe('password');
  });

  it('ô thường không có nút con mắt', () => {
    render(<Field label="Email" type="email" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
