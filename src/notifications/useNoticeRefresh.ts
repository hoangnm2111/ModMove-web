import { useEffect, useRef } from 'react';
import type { NoticeData } from './catalog';
import { noticeBus } from './realtime';

/**
 * Tải lại dữ liệu của trang đang mở khi có thông báo liên quan (`match` đúng).
 * `match`/`reload` đọc qua ref nên truyền hàm tạo mới mỗi lần render cũng không làm đăng ký lại.
 */
export function useNoticeRefresh(match: (type: string, data: NoticeData) => boolean, reload: () => void): void {
  const matchRef = useRef(match);
  const reloadRef = useRef(reload);
  matchRef.current = match;
  reloadRef.current = reload;
  useEffect(
    () =>
      noticeBus.on((type, data) => {
        if (matchRef.current(type, data)) reloadRef.current();
      }),
    []
  );
}
