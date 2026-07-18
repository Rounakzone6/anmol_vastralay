import { Module } from '@nestjs/common';
import { CloudinaryService } from '@backend/services/cloudinary.service';

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
