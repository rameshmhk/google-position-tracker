/**
 * Cleans a URL by removing protocol (http/https) and the 'www.' subdomain.
 * @param {string} url - The URL string to clean.
 * @returns {string} - The cleaned root domain.
 */
export const cleanWebsiteUrl = (url) => {
  if (!url) return '';
  return url
    .trim()
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/i, '') // Strips http, https, and www in one go
    .split('/')[0]                          // Takes only the domain part
    .replace(/\/+$/, '');                    // Final safety for trailing slashes
};
