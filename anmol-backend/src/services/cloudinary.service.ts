import {
  Injectable,
  ServiceUnavailableException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import ImageKit from 'imagekit';
import { createImageKitInstance } from '@backend/config/imagekit.config';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private cloudinaryConfigured: boolean = false;
  private imagekitConfigured: boolean = false;
  private imagekit: ImageKit | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    this.cloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

    if (this.cloudinaryConfigured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }

    this.imagekit = createImageKitInstance(this.config);
    this.imagekitConfigured = this.imagekit !== null;
  }

  assertConfigured(): void {
    if (!this.cloudinaryConfigured && !this.imagekitConfigured) {
      throw new ServiceUnavailableException(
        'Neither Cloudinary nor ImageKit are configured. Add credentials to .env',
      );
    }
  }

  async uploadImage(
    dataUri: string,
    folder = 'anmol/products',
  ): Promise<{ url: string; publicId: string }> {
    this.assertConfigured();

    // Randomly select between ImageKit and Cloudinary to balance the load
    // if both are configured.
    let useImageKit = false;
    if (this.imagekitConfigured && this.cloudinaryConfigured) {
      useImageKit = Math.random() < 0.5; // 50% chance
    } else if (this.imagekitConfigured) {
      useImageKit = true;
    }

    if (useImageKit) {
      try {
        const result = await this.imagekit!.upload({
          file: dataUri,
          fileName: `img_${Date.now()}`,
          folder: folder,
        });
        // Prefix with 'ik:' to identify ImageKit uploads for deletion
        return { url: result.url, publicId: `ik:${result.fileId}` };
      } catch (error) {
        if (this.cloudinaryConfigured) {
          console.error('ImageKit upload failed, falling back to Cloudinary:', error);
          return this.uploadToCloudinary(dataUri, folder);
        }
        throw error;
      }
    } else {
      try {
        return await this.uploadToCloudinary(dataUri, folder);
      } catch (error) {
        if (this.imagekitConfigured) {
          console.error('Cloudinary upload failed, falling back to ImageKit:', error);
          const result = await this.imagekit!.upload({
            file: dataUri,
            fileName: `img_${Date.now()}`,
            folder: folder,
          });
          return { url: result.url, publicId: `ik:${result.fileId}` };
        }
        throw error;
      }
    }
  }

  private async uploadToCloudinary(dataUri: string, folder: string) {
    const result = await cloudinary.uploader.upload(dataUri, { folder });
    return { url: result.secure_url, publicId: result.public_id };
  }

  async uploadPdf(
    data: Buffer,
    folder = 'anmol/invoices',
    publicId?: string,
  ): Promise<{ url: string; publicId: string }> {
    this.assertConfigured();
    
    // Prefer Cloudinary for PDF buffers due to native support for upload_stream
    if (this.cloudinaryConfigured) {
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
    } else {
      // Fallback to ImageKit for PDF
      const result = await this.imagekit!.upload({
        file: data.toString('base64'),
        fileName: publicId || `invoice_${Date.now()}.pdf`,
        folder: folder,
      });
      return { url: result.url, publicId: `ik:${result.fileId}` };
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    this.assertConfigured();
    
    if (publicId.startsWith('ik:')) {
      if (this.imagekitConfigured) {
        const fileId = publicId.substring(3);
        await this.imagekit!.deleteFile(fileId);
      }
    } else {
      if (this.cloudinaryConfigured) {
        await cloudinary.uploader.destroy(publicId);
      }
    }
  }
}
