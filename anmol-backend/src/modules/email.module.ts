import { Module } from '@nestjs/common';
import { EmailService } from '@backend/services/email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
