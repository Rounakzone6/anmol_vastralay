import {
  Injectable,
  ServiceUnavailableException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private configured: boolean = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    this.configured = Boolean(cloudName && apiKey && apiSecret);

    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
  }

  assertConfigured(): void {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env',
      );
    }
  }

  async uploadImage(
    dataUri: string,
    folder = 'anmol/products',
  ): Promise<{ url: string; publicId: string }> {
    this.assertConfigured();
    const result = await cloudinary.uploader.upload(dataUri, { folder });
    return { url: result.secure_url, publicId: result.public_id };
  }

  async uploadPdf(
    data: Buffer,
    folder = 'anmol/invoices',
    publicId?: string,
  ): Promise<{ url: string; publicId: string }> {
    this.assertConfigured();
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'raw',
          format: 'pdf',
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            reject(error || new Error('Cloudinary did not return an uploaded PDF'));
            return;
          }
          resolve({
            secure_url: uploaded.secure_url,
            public_id: uploaded.public_id,
          });
        },
      );
      stream.end(data);
    });
    return { url: result.secure_url, publicId: result.public_id };
  }

  async deleteImage(publicId: string): Promise<void> {
    this.assertConfigured();
    await cloudinary.uploader.destroy(publicId);
  }
}
