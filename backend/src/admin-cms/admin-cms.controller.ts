import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminCmsGuard } from './admin-cms.guard.js';
import { AdminCmsService } from './admin-cms.service.js';
import { CreateProtocolTemplateDto, UpdateProtocolTemplateDto } from './dto/protocol-template.dto.js';
import { CreatePhaseDto, UpdatePhaseDto } from './dto/phase.dto.js';
import { CreateExerciseDto, UpdateExerciseDto } from './dto/exercise.dto.js';
import { CreatePhaseExerciseDto, UpdatePhaseExerciseDto } from './dto/phase-exercise.dto.js';
import {
  CreatePerformanceProgramTemplateDto,
  UpdatePerformanceProgramTemplateDto,
} from './dto/performance-program.dto.js';
import {
  CreatePerformanceProgramExerciseDto,
  UpdatePerformanceProgramExerciseDto,
} from './dto/performance-program-exercise.dto.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminCmsGuard)
export class AdminCmsController {
  constructor(private readonly adminCms: AdminCmsService) {}

  @Get('protocol-templates')
  listProtocolTemplates() {
    return this.adminCms.listProtocolTemplates();
  }

  @Get('protocol-templates/:id')
  getProtocolTemplate(@Param('id') id: string) {
    return this.adminCms.getProtocolTemplate(id);
  }

  @Post('protocol-templates')
  createProtocolTemplate(@Body() dto: CreateProtocolTemplateDto) {
    return this.adminCms.createProtocolTemplate(dto);
  }

  @Patch('protocol-templates/:id')
  updateProtocolTemplate(@Param('id') id: string, @Body() dto: UpdateProtocolTemplateDto) {
    return this.adminCms.updateProtocolTemplate(id, dto);
  }

  @Delete('protocol-templates/:id')
  deleteProtocolTemplate(@Param('id') id: string) {
    return this.adminCms.deleteProtocolTemplate(id);
  }

  @Post('protocol-templates/:templateId/phases')
  createPhase(@Param('templateId') templateId: string, @Body() dto: CreatePhaseDto) {
    return this.adminCms.createPhase(templateId, dto);
  }

  @Patch('phases/:id')
  updatePhase(@Param('id') id: string, @Body() dto: UpdatePhaseDto) {
    return this.adminCms.updatePhase(id, dto);
  }

  @Delete('phases/:id')
  deletePhase(@Param('id') id: string) {
    return this.adminCms.deletePhase(id);
  }

  @Post('phases/:phaseId/exercises')
  addExerciseToPhase(@Param('phaseId') phaseId: string, @Body() dto: CreatePhaseExerciseDto) {
    return this.adminCms.addExerciseToPhase(phaseId, dto);
  }

  @Patch('phase-exercises/:id')
  updatePhaseExercise(@Param('id') id: string, @Body() dto: UpdatePhaseExerciseDto) {
    return this.adminCms.updatePhaseExercise(id, dto);
  }

  @Delete('phase-exercises/:id')
  removeExerciseFromPhase(@Param('id') id: string) {
    return this.adminCms.removeExerciseFromPhase(id);
  }

  @Get('exercises')
  listExercises() {
    return this.adminCms.listExercises();
  }

  @Post('exercises')
  createExercise(@Body() dto: CreateExerciseDto) {
    return this.adminCms.createExercise(dto);
  }

  @Patch('exercises/:id')
  updateExercise(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.adminCms.updateExercise(id, dto);
  }

  @Delete('exercises/:id')
  deleteExercise(@Param('id') id: string) {
    return this.adminCms.deleteExercise(id);
  }

  @Get('performance-programs')
  listPerformanceProgramTemplates() {
    return this.adminCms.listPerformanceProgramTemplates();
  }

  @Get('performance-programs/:id')
  getPerformanceProgramTemplate(@Param('id') id: string) {
    return this.adminCms.getPerformanceProgramTemplate(id);
  }

  @Post('performance-programs')
  createPerformanceProgramTemplate(@Body() dto: CreatePerformanceProgramTemplateDto) {
    return this.adminCms.createPerformanceProgramTemplate(dto);
  }

  @Patch('performance-programs/:id')
  updatePerformanceProgramTemplate(@Param('id') id: string, @Body() dto: UpdatePerformanceProgramTemplateDto) {
    return this.adminCms.updatePerformanceProgramTemplate(id, dto);
  }

  @Delete('performance-programs/:id')
  deletePerformanceProgramTemplate(@Param('id') id: string) {
    return this.adminCms.deletePerformanceProgramTemplate(id);
  }

  @Post('performance-programs/:templateId/exercises')
  addExerciseToPerformanceProgram(
    @Param('templateId') templateId: string,
    @Body() dto: CreatePerformanceProgramExerciseDto,
  ) {
    return this.adminCms.addExerciseToPerformanceProgram(templateId, dto);
  }

  @Patch('performance-program-exercises/:id')
  updatePerformanceProgramExercise(@Param('id') id: string, @Body() dto: UpdatePerformanceProgramExerciseDto) {
    return this.adminCms.updatePerformanceProgramExercise(id, dto);
  }

  @Delete('performance-program-exercises/:id')
  removeExerciseFromPerformanceProgram(@Param('id') id: string) {
    return this.adminCms.removeExerciseFromPerformanceProgram(id);
  }
}
