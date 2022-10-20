import { Module } from '@nestjs/common';
import { StoryModule } from 'src/story/story.module';
import { ChainService } from './chain.service';
import { IcModule } from './ic/ic.module';

@Module({
  imports: [StoryModule, IcModule],
  providers: [ChainService],
  exports: [ChainService],
})
export class ChainModule {}
