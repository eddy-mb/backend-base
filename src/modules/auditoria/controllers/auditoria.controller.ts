import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuditoriaService } from '../services/auditoria.service';
import { AuditoriaQueryDto } from '../dto/auditoria.dto';
import { UsePagination } from '@/modules/respuestas';

@ApiTags('Auditoría')
@Controller('auditoria')
// @UseGuards(AuthGuard, AdminGuard) // TODO: Falta implementar
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @UsePagination()
  @ApiOperation({ summary: 'Consultar logs de auditoría con filtros' })
  async consultarLogs(@Query() query: AuditoriaQueryDto) {
    return await this.auditoriaService.buscar(query);
  }
}
