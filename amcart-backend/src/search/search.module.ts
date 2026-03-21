import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { SearchSeedService } from './search-seed.service';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const username = config.get<string>('ELASTICSEARCH_USERNAME');
        const password = config.get<string>('ELASTICSEARCH_PASSWORD');

        return {
          node: config.get<string>('ELASTICSEARCH_NODE', 'http://localhost:9200'),
          ...(username && password ? { auth: { username, password } } : {}),
        };
      },
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService, SearchSeedService],
  exports: [SearchService],
})
export class SearchModule {}