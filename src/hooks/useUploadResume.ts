import { getApiUrl } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query'
export function useUploadResume() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(getApiUrl('/api/resume'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
  });
}
