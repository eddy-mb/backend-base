import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuditoriaService } from '../services/auditoria.service';
import { AuditoriaQueryDto } from '../dto/auditoria.dto';
import { BaseController } from '@/common';

@ApiTags('Auditoría')
@Controller('auditoria')
// @UseGuards(AuthGuard, AdminGuard) // TODO: Falta implementar
export class AuditoriaController extends BaseController {
  constructor(private readonly auditoriaService: AuditoriaService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: 'Consultar logs de auditoría con filtros' })
  async consultarLogs(@Query() query: AuditoriaQueryDto) {
    const [logs, total] = await this.auditoriaService.buscar(query);
    return this.paginated(logs, total);
  }
}
