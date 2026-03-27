import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodeGeneratorService } from './code-generator.service';
import { CodeGeneratorController } from './code-generator.controller';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [CodeGeneratorController],
  providers: [CodeGeneratorService],
})
export class CodeGeneratorModule {}
