import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import { apiClient } from './apiClient';

export const MAX_PRODUCT_IMAGE_BYTES = 50 * 1024;

const productImageDirectory = new Directory(Paths.document, 'product-images');
const MAX_DIMENSIONS = [512, 384, 256, 192, 128];
const JPEG_QUALITIES = [0.72, 0.55, 0.4, 0.28];

function ensureDirectory(directory) {
  if (!directory.exists) {
    directory.create({ idempotent: true, intermediates: true });
  }
}

async function compressToLimit(sourceUri) {
  const original = await ImageManipulator.manipulate(sourceUri).renderAsync();
  if (!original.width || !original.height) throw new Error('Invalid product image dimensions');

  for (const maxDimension of MAX_DIMENSIONS) {
    const scale = Math.min(1, maxDimension / Math.max(original.width, original.height));
    const width = Math.max(1, Math.round(original.width * scale));
    const height = Math.max(1, Math.round(original.height * scale));
    const rendered = await ImageManipulator.manipulate(sourceUri)
      .resize({ width, height })
      .renderAsync();

    for (const quality of JPEG_QUALITIES) {
      const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: quality });
      const file = new File(result.uri);
      if (file.exists && file.size > 0 && file.size <= MAX_PRODUCT_IMAGE_BYTES) return file.uri;
      if (file.exists) file.delete();
    }
  }

  throw new Error('PRODUCT_IMAGE_EXCEEDS_SIZE_LIMIT');
}

async function copyCompressedImage(sourceUri, destination) {
  const source = new File(sourceUri);
  if (!source.exists || !source.size || source.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error('PRODUCT_IMAGE_EXCEEDS_SIZE_LIMIT');
  }
  if (destination.exists) destination.delete();
  try {
    await source.copy(destination);
    if (!destination.exists || !destination.size || destination.size > MAX_PRODUCT_IMAGE_BYTES) {
      throw new Error('PRODUCT_IMAGE_EXCEEDS_SIZE_LIMIT');
    }
    return destination.uri;
  } catch (error) {
    if (destination.exists) destination.delete();
    throw error;
  }
}

export function compressProductImage(sourceUri) {
  return compressToLimit(sourceUri);
}

export async function persistCompressedProductImage(sourceUri) {
  ensureDirectory(productImageDirectory);
  return copyCompressedImage(sourceUri, new File(productImageDirectory, `${randomUUID()}.jpg`));
}

export async function ensureProductImageWithinLimit(localUri) {
  const file = new File(localUri);
  if (!file.exists || !file.size) throw new Error('Product image is missing on this device');
  const directoryPrefix = `${productImageDirectory.uri.replace(/\/$/, '')}/`;
  if (file.size <= MAX_PRODUCT_IMAGE_BYTES && localUri.startsWith(directoryPrefix)) return localUri;

  const compressedUri = await compressToLimit(localUri);
  try {
    return await persistCompressedProductImage(compressedUri);
  } finally {
    const compressedFile = new File(compressedUri);
    if (compressedFile.exists) compressedFile.delete();
  }
}

export function deleteLocalProductImage(uri) {
  if (!uri) return;
  const directoryPrefix = `${productImageDirectory.uri.replace(/\/$/, '')}/`;
  if (!uri.startsWith(directoryPrefix)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}

function hashUrl(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(16);
}

export async function cacheRemoteProductImage(remoteUrl, productId) {
  if (!/^https?:\/\//i.test(remoteUrl)) throw new Error('Invalid remote product image URL');
  ensureDirectory(productImageDirectory);
  const destination = new File(productImageDirectory, `product-${productId}-${hashUrl(remoteUrl)}.jpg`);
  if (destination.exists && destination.size > 0 && destination.size <= MAX_PRODUCT_IMAGE_BYTES) {
    return destination.uri;
  }
  if (destination.exists) destination.delete();

  const downloadedFile = new File(Paths.cache, `${randomUUID()}.download`);
  let compressedUri;
  try {
    await File.downloadFileAsync(remoteUrl, downloadedFile);
    compressedUri = await compressToLimit(downloadedFile.uri);
    return await copyCompressedImage(compressedUri, destination);
  } finally {
    if (downloadedFile.exists) downloadedFile.delete();
    if (compressedUri) {
      const compressedFile = new File(compressedUri);
      if (compressedFile.exists) compressedFile.delete();
    }
  }
}

export async function uploadProductImage(shopId, deviceId, localUri) {
  const file = new File(localUri);
  if (!file.exists || !file.size || file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error('Product image is missing or exceeds the 50 KB limit');
  }

  const formData = new FormData();
  formData.append('image', { uri: file.uri, name: 'product.jpg', type: 'image/jpeg' });
  const { data } = await apiClient.post('/sync/images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'X-Shop-Id': String(shopId),
      'X-Device-Id': deviceId,
    },
  });
  if (typeof data?.imageUrl !== 'string' || !data.imageUrl) {
    throw new Error('Sync server did not return the uploaded image URL');
  }
  return data.imageUrl;
}
