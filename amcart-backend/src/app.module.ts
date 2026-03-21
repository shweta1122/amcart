import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SearchModule } from './search/search.module';  
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    // Load .env file
    ConfigModule.forRoot({ isGlobal: true }),

    // PostgreSQL via TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'amcart_auth'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production', // disable in prod
        logging: config.get('NODE_ENV') === 'development',
        ssl: config.get('DB_SSL', 'false') === 'true'
          ? { rejectUnauthorized: true }
          : false,
      }),
    }),

    AuthModule,
    UserModule,
    SearchModule,
    CartModule,
    WishlistModule,
    OrderModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
