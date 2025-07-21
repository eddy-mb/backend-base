import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './filters/error.filter';
import { PaginationUtils } from './utils/pagination.utils';

@Global()
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: ErrorFilter,
    },
    PaginationUtils,
  ],
  exports: [PaginationUtils],
})
export class ResponseModule {}
