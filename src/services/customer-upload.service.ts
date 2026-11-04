import { apiClient, toServiceError } from './api';

/** POST api/customer/uploads – ảnh hàng hoá, minh chứng khiếu nại/sự cố (GB-06: JPG/PNG ≤ 5MB, Cloudinary). */
export const customerUploadService = {
  async uploadImage(file: File): Promise<string> {
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await apiClient.post<{ url: string }>('/customer/Uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data.url;
    } catch (e) {
      throw toServiceError(e);
    }
  },
};
