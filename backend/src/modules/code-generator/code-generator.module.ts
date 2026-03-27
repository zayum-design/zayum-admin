import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodeGeneratorService } from './code-generator.service';
import { CodeGeneratorController } from './code-generator.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([]), AiModule],
  controllers: [CodeGeneratorController],
  providers: [CodeGeneratorService],
})
export class CodeGeneratorModule {}
