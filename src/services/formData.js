// Shared helpers for multipart/form-data requests (product/category images,
// shop logos) — the backend uses multer, not JSON base64 uploads.

export function toFormData(fields) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, value);
  });
  return form;
}

// asset: the object returned by expo-image-picker's launchImageLibraryAsync
// (has .uri, .fileName, .mimeType). Returns the React-Native FormData file
// shape, or undefined if no asset was picked (field omitted from the form).
export function toImagePart(asset) {
  if (!asset) return undefined;
  return { uri: asset.uri, name: asset.fileName || `photo_${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' };
}
