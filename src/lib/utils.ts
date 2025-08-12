import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Constructs a full, absolute URL for an API endpoint.
 * Ensures that all API calls use the base URL from environment variables.
 * @param path - The relative path of the API endpoint (e.g., "/api/resume").
 * @returns The full URL for the API endpoint.
 * */

export function getApiUrl(path: string): string {
  // Ensure the path starts with a slash
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;

  // Use NEXT_PUBLIC_URL from your environment variables
  return `${process.env.NEXT_PUBLIC_URL}${sanitizedPath}`;
}