/**
 * Formats a default kitchen name from an organization/college/hostel name.
 * By default, appends "'s kitchen" (e.g. "IIT Bombay" -> "IIT Bombay's kitchen").
 * Avoids duplicate suffixes if the organization already contains "kitchen".
 */
export const formatDefaultKitchenName = (organization: string): string => {
  const trimmed = organization.trim();
  if (!trimmed) {
    return "Your kitchen";
  }

  // If already ends with "'s kitchen" or " kitchen" (case-insensitive), avoid duplicate
  if (/(?:'s\s+kitchen|\s+kitchen)$/i.test(trimmed)) {
    return trimmed;
  }

  // If ends with "'s" or "'S" (e.g. "St. Joseph's"), append " kitchen"
  if (/'s$/i.test(trimmed)) {
    return `${trimmed} kitchen`;
  }

  // Default: append "'s kitchen"
  return `${trimmed}'s kitchen`;
};
