import { Injectable, BadRequestException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): Promise<void> {
    throw new BadRequestException(
      'Has superado el número máximo de intentos. Intenta nuevamente más tarde.',
    );
  }
}
