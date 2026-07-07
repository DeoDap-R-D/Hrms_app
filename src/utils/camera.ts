import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

export interface CapturedImage {
  uri: string;
  base64: string;
}

/** Open the camera to take a photo and return base64 + uri (or null if cancelled). */
export async function capturePhoto(): Promise<CapturedImage | null> {
  const result = await launchCamera({
    mediaType: 'photo',
    includeBase64: true,
    quality: 0.6,
    maxWidth: 800,
    maxHeight: 800,
    saveToPhotos: false,
  });

  if (result.didCancel || result.errorCode) return null;
  const asset = result.assets?.[0];
  if (!asset?.uri) return null;
  const mime = asset.type || 'image/jpeg';
  return { uri: asset.uri, base64: asset.base64 ? `data:${mime};base64,${asset.base64}` : '' };
}

/** Pick a photo from the gallery and return base64 + uri (or null if cancelled). */
export async function pickPhoto(): Promise<CapturedImage | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    includeBase64: true,
    quality: 0.6,
    maxWidth: 800,
    maxHeight: 800,
    selectionLimit: 1,
  });

  if (result.didCancel || result.errorCode) return null;
  const asset = result.assets?.[0];
  if (!asset?.uri) return null;
  const mime = asset.type || 'image/jpeg';
  return { uri: asset.uri, base64: asset.base64 ? `data:${mime};base64,${asset.base64}` : '' };
}

/** Open the front camera for a selfie and return base64 + uri (or null if cancelled). */
export async function captureSelfie(): Promise<CapturedImage | null> {
  const result = await launchCamera({
    mediaType: 'photo',
    cameraType: 'front',
    includeBase64: true,
    quality: 0.6,
    maxWidth: 800,
    maxHeight: 800,
    saveToPhotos: false,
  });

  if (result.didCancel || result.errorCode) return null;
  const asset = result.assets?.[0];
  if (!asset?.base64 || !asset.uri) return null;
  const mime = asset.type || 'image/jpeg';
  return { uri: asset.uri, base64: `data:${mime};base64,${asset.base64}` };
}
