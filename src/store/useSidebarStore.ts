import { create } from 'zustand';

/**
 * Trạng thái mở/đóng menu bên – dùng chung cho mọi layout (Customer/Driver/Dispatcher/Admin).
 * Giữ nguyên khi chuyển trang và khi layout được mount lại; chỉ đóng khi bấm nút X.
 */
const KEY = 'modmove:sidebarOpen';
const read = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

interface SidebarState {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  isSidebarOpen: read(),
  setIsSidebarOpen: (open) => {
    try {
      localStorage.setItem(KEY, open ? '1' : '0');
    } catch {
      /* ignore */
    }
    set({ isSidebarOpen: open });
  },
  toggleSidebar: () => get().setIsSidebarOpen(!get().isSidebarOpen),
}));
