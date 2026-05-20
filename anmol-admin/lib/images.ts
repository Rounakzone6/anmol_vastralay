const MAX_BYTES = 5 * 1024 * 1024;

export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (JPG, PNG, WebP)'));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error('Image must be under 5 MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
