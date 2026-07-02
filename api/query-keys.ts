import { ProductSearchContext } from '@/api/products';

export const queryKeys = {
  auth: {
    currentUser: () => ['currentUser'] as const,
  },
  groceries: {
    all: () => ['groceries'] as const,
    previews: () => ['grocery-preview'] as const,
    preview: (start: string, end: string) => ['grocery-preview', start, end] as const,
  },
  invitations: {
    all: () => ['invitations'] as const,
  },
  products: {
    all: () => ['products'] as const,
    suggestions: {
      all: () => ['suggestions'] as const,
      search: (context: ProductSearchContext, query: string) => ['suggestions', context, query] as const,
    },
  },
  pantry: {
    all: () => ['pantry'] as const,
  },
  consumptionLogs: {
    all: () => ['consumptionLogs'] as const,
  },
  recipes: {
    all: () => ['recipes'] as const,
    detail: (id: string) => ['recipes', id] as const,
  },
  schedules: {
    all: () => ['schedule'] as const,
    week: (weekKey: string) => ['schedule', weekKey] as const,
  },
};
