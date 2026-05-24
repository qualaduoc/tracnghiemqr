/**
 * Utility helper to convert Google Drive viewing URLs into direct image stream links.
 * Handled formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID/edit
 */
export const getDirectImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  
  // Detect Google Drive Link
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    let fileId = "";
    
    // Case: /file/d/FILE_ID/view
    const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) {
      fileId = matchD[1];
    } else {
      // Case: ?id=FILE_ID
      const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        fileId = matchId[1];
      }
    }
    
    if (fileId) {
      // Return high-speed hotlink URL for Google Drive images
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  return url;
};
