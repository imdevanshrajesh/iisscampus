export const RECOMMENDED_IMAGE_HOST = "res.cloudinary.com";

export const IMAGE_URL_EXAMPLE =
  "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/photo.jpg";

export const IMAGE_HOSTS_GUIDE = [
  "Upload the photo to Cloudinary (free plan), then copy the secure delivery URL.",
  `Add ${RECOMMENDED_IMAGE_HOST} under Approved image hosts below and save.`,
  "Paste the https:// address into the event, achievement, council, newsletter, or wellness form.",
  "Use alternative text to describe the photograph. Google Drive and Docs links stay blocked.",
] as const;
