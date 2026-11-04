/** Khớp với Application.Common.Models.PagedResult<T> của backend. */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}
