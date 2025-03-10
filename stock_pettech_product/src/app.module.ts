import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StockModule } from './stock/stock.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register(),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://mongo:27017/default'),
    StockModule, 
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'defaultSecret',
      signOptions: { expiresIn: '10m' }
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
