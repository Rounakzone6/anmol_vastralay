import ImageKit from 'imagekit';
import { ConfigService } from '@nestjs/config';

export const createImageKitInstance = (configService: ConfigService): ImageKit | null => {
  const publicKey = configService.get<string>('IMAGEKIT_PUBLIC_KEY');
  const privateKey = configService.get<string>('IMAGEKIT_PRIVATE_KEY');
  const urlEndpoint = configService.get<string>('IMAGEKIT_URL_ENDPOINT');

  if (publicKey && privateKey && urlEndpoint) {
    return new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }

  return null;
};
