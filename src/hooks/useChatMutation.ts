import { getApiUrl } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
export function useChatMutation() {
  return useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from the assistant');
      }
      return response.json();
    },
  });
}
