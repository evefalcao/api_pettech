# Desenvolvendo um sistema de estoque para o Pettech

A seguir é apresentado o processo de construção de um sistema de estoque integrado usando uma arquitetura de microserviços para o Pettech. Ele foi escrito em TypeScript e utiliza o framework NestJS com Node.js 20. O projeto emprega diversas ferranebtas e bibliotecas, incluindo:

- MongoDB - Banco de dados NoSQL orientado a documentos
- Mongoose - ODM para facilitar a interação com o MongoDB
- Docker - Para containerização do MongoDB
- NestJS CLI - Ferramenta para criação e gerenciamento de projetos NestJS
- ESLint e Prettier - Para padronização e formatação de código
- Zod - Biblioteca para validação de dados
- JWT (@nestjs/jwt) - Para implementação de autenticação baseada em tokens
- node-fetch - Para requisições HTTP entre microserviços
- @nestjs/config - Para gerenciamento de variáveis de ambiente
- RxJS - Usado nos interceptors para manipulação de observables
- Postman - Ferramenta para teste de APIs

Esta documentação é a segunda parte do [projeto apresentado pelo Prof. Gustavo Lima](https://github.com/GustavoLima93/nodejs_integracao_banco_fiap) na disciplina de Integração com Banco de Dados da [pós-graduação em desenvolvimento full-stack da FIAP](https://postech.fiap.com.br/curso/full-stack-development/) e complementa a documentação detalhada da [primeira parte escrita por Aurélio Soares](https://github.com/aurelio-sc/fiap-pos-tech-nodejs-integracao-com-o-banco). O projeto mostra uma implementação prática do padrão Repository, técnicas de validação, autenticação e comunicação entre serviços.

## Preparando o ambiente

### Parte 1: Configuração Inicial

**MongoDB**: MongoDB é um banco de dados NoSQL orientado a documentos que armazena dados em formato JSON-like, oferecendo alta escalabilidade e flexibilidade para aplicações modernas.

Para iniciar o MongoDB em um container Docker, execute o comando:

```bash
docker run --name myMongoDB -p 27017:27017 -d mongo:latest
```

Este comando cria um container chamado "myMongoDB", mapeando a porta padrão 27017 do MongoDB para acesso local.

**Instalando o NestJS CLI**

NestJS é um framework Node.js progressivo que utiliza TypeScript e combina elementos de POO (Programação Orientada a Objetos), FP (Programação Funcional) e FRP (Programação Reativa Funcional). Suporta tanto Express quanto Fastify como servidores HTTP subjacentes.

Instale o CLI globalmente:

```bash
npm i -g @nestjs/cli
```

**Criando um novo projeto NestJS**:

```bash
nest new stock_pettech_product
```

Selecione "npm" como gerenciador de pacotes quando solicitado durante a criação do projeto.

Após a criação do projeto, remova o arquivo de teste `app.controller.spec.ts` para simplificar nosso projeto.

**Configurando o ESLint**:

Adicione as seguintes regras ao arquivo de configuração do ESLint para padronizar o estilo de código:

```json
// ...
"prettier/prettier": [
  "error",
  {
    'endOfLine': 'auto',
    "singleQuote": true,
    "semi": true,
    "trailingComma": "all",
  }
]
// ...
```

Esta configuração estabelece um estilo consistente para o código: aspas simples, ponto-e-vírgula obrigatório e vírgula final em estruturas de código.

### Parte 2: Estruturação do Módulo de Estoque

**Instalando o Mongoose**:

Mongoose é uma biblioteca ODM (Object Data Modeling) para MongoDB que facilita a interação com o banco de dados:

```bash
npm i @nestjs/mongoose mongoose
```

**Criando o módulo de estoque**:

```bash
nest generate module stock
```

Este comando cria automaticamente a estrutura básica do módulo stock.

**Configurando a conexão com MongoDB**:

No arquivo `app.module.ts`, adicione o módulo MongooseModule:

```tsx
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StockModule } from './stock/stock.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/pettech'), StockModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Este código configura a conexão com o banco de dados MongoDB local chamado "pettech".

**Definindo a interface do produto**:

Crie o arquivo `product.interface.ts` em `src/stock/schemas/models`:

```tsx
export interface IProduct {
  id?: number;
  name: string;
  quantity: number;
  relationId: string;
}
```

Esta interface define a estrutura de dados para os produtos no estoque.

**Adicionando regra de nomenclatura no ESLint**:

No arquivo `eslint.config.mjs`, adicione uma regra para padronizar a nomenclatura de interfaces:

```json
"@typescript-eslint/naming-convention": [
  "error",
  {
    "selector": "interface",
    "format": ["PascalCase"],
    "custom": {
      "regex": "^I[A-Z]",
      "match": true
    }
  },
],
```

Esta regra força que todas as interfaces comecem com a letra "I" seguida de texto em PascalCase (ex: IProduct).

**Criando o schema do Mongoose**:

Crie o arquivo `product.schema.ts` em `src/stock/schemas`:

```tsx
import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { IProduct } from "./models/product.interface";
import mongoose, { HydratedDocument } from "mongoose";

export type ProductDocument = HydratedDocument<Product>

@Schema()
export class Product implements IProduct{
  @Prop({ type: mongoose.Schema.Types.ObjectId})
  id?: number | undefined;
  @Prop()
  name: string;
  @Prop()
  quantity: number;
  @Prop()
  relationId: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
```

Este schema define como os produtos serão estruturados no MongoDB, usando decoradores para mapear propriedades.

**Atualizando o módulo de estoque**:

Em `stock.module.ts`:

```tsx
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])
  ]
})
export class StockModule {}
```

Esta configuração registra o schema do produto no módulo de estoque, permitindo injeção nos serviços.

### Parte 3: Implementando o Padrão Repository

**Criando a classe abstrata repository**:

Em `src/stock/repositories/product.repository.ts`:

```tsx
import { IProduct } from "../schemas/models/product.interface";

export abstract class ProductRepository {
  abstract getAllStock(limit: number, page: number): Promise<IProduct[]>;
  abstract getStockById(productId: string): Promise<IProduct>;
  abstract createStock(product: IProduct): Promise<void>;
  abstract updateStock(productId: string, stock: number): Promise<void>;
  abstract deleteStock(productId: string): Promise<void>;
}
```

Esta classe abstrata define a interface para operações de banco de dados, seguindo o padrão Repository.

**Implementando o repository concreto**:

Em `src/stock/repositories/mongoose/product.mongoose.repository.ts`:

```tsx
import { IProduct } from "src/stock/schemas/models/product.interface";
import { ProductRepository } from "../product.repository";
import { Product } from "src/stock/schemas/product.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

export class ProductMongooseRepository implements ProductRepository {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  getAllStock(limit: number, page: number): Promise<IProduct[]> {
    const offset = (page - 1) * limit

    return this.productModel.find().skip(offset).limit(limit).exec()
  }
  getStockById(productId: string): Promise<IProduct> {
    return this.productModel.findById(productId).exec()
  }
  async createStock(product: IProduct): Promise<void> {
    const createStock = new this.productModel(product)
    await createStock.save()
  }
  async updateStock(productId: string, stock: number): Promise<void> {
    await this.productModel.updateOne({ _id: productId}, { quantity: stock}).exec()
  }
  async deleteStock(productId: string): Promise<void> {
    await this.productModel.deleteOne( { _id: productId }).exec()
  }
}
```

Esta implementação concreta do repository utiliza Mongoose para executar operações no MongoDB.

**Atualizando providers no módulo**:

Adicione o seguinte ao `stock.module.ts`:

```tsx
providers: [
  {
    provide: ProductRepository,
    useClass: ProductMongooseRepository
  }
],
```

Esta configuração registra o repository no sistema de injeção de dependências do NestJS.

**Criando o serviço de estoque**:

Em `stock.service.ts`:

```tsx
import { Injectable } from "@nestjs/common";
import { ProductRepository } from "../repositories/product.repository";

@Injectable()
export class StockService {
  constructor(private readonly productRepository: ProductRepository) {}

  async getAllStock(limit: number, page: number) {
    return this.productRepository.getAllStock(limit, page)
  }

  async getStockById(productId: string) { // OBS: No video, o professor nomeia como getStock
    return this.productRepository.getStockById(productId)
  }

  async createStock(product) {
    return this.productRepository.createStock(product)
  }

  async updateStock(productId: string, stock: number) {
    return this.productRepository.updateStock(productId, stock)
  }

  async deleteStock(productId: string) {
    return this.productRepository.deleteStock(productId)
  }
}
```

O StockService atua como uma camada de abstração entre os controllers e o repository.

**Atualizando o módulo novamente**:

Atualize o `stock.module.ts` para incluir o serviço:

```tsx
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductMongooseRepository } from './repositories/mongoose/product.mongoose.repository';
import { ProductRepository } from './repositories/product.repository';
import { StockService } from './services/stock.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])
  ],
  providers: [
    {
      provide: ProductRepository,
      useClass: ProductMongooseRepository
    },
    StockService,
  ],
})
export class StockModule {}
```

**Criando o controller de estoque**:

Em `stock.controller.ts`:

```tsx
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { StockService } from "../services/stock.service";
import { IProduct } from "../schemas/models/product.interface";

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService){}

  @Get()
  async getAllStock(@Query('limit') limit: number, @Query('page') page: number) {
    return this.stockService.getAllStock(limit, page)
  }

  @Get(':productId')
  async getStockById(@Param('productId') productId: string) {
    return this.stockService.getStockById(productId)
  }

  @Post()
  async createStock(@Body() product: IProduct) {
    return this.stockService.createStock(product)
  }

  @Put(':productId')
  async updateStock(@Param('productId') productId: string, @Body('stock') stock: number) {
    return this.stockService.updateStock(productId, stock)
  }

  @Delete(':productId')
  async deleteStock(@Param('productId') productId: string) {
    return this.stockService.deleteStock(productId)
  }
}
```

O controller expõe endpoints REST para cada operação de estoque.

### Parte 4: Validação e Tratamento de Erros

**Registrando o controller no módulo**:

Adicione ao `stock.module.ts`:

```tsx
controllers: [
  StockController
],
```

Execute o MongoDB via Docker e inicie a aplicação com `npm run start:dev` para testar no Postman.

**Adicionando tratamento de exceção**:

Em `product.mongoose.repository.ts`, adicione o tratamento para produtos não encontrados:

```tsx
async getStockById(productId: string): Promise<IProduct> {
  const product = await this.productModel.findById(productId).exec();
  if (!product) throw new NotFoundException(`Product not found`);
  return product
}

```

Esta modificação lança uma exceção quando um produto não é encontrado.

**Instalando o Zod para validação**:

```bash
npm i zod
```

**Criando um pipe de validação com Zod**:

Em `src/shared/pipe/zod-validation.pipe.ts`:

```tsx
import { BadRequestException, PipeTransform } from "@nestjs/common";
import { ZodSchema } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema){}

  transform(value: any) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch(error) {
      throw new BadRequestException("Validation failed");
    }
  }
}
```

Este pipe personalizado utiliza o Zod para validar dados de entrada.

**Atualizando o controller com validação**:

Em `stock.controller.ts`, adicione esquemas de validação Zod:

```tsx
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UsePipes } from "@nestjs/common";
import { StockService } from "../services/stock.service";
import { z } from "zod";
import { ZodValidationPipe } from "src/shared/pipe/zod-validation.pipe";

const createStockSchema = z.object({
  name: z.string(),
  quantity: z.coerce.number(),
  relationId: z.string()
})

const updateStockSchema = z.object({
  stock: z.coerce.number()
})

type CreateStock = z.infer<typeof createStockSchema>
type UpdateStock = z.infer<typeof updateStockSchema>

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService){}

  @Get()
  async getAllStock(@Query('limit') limit: number, @Query('page') page: number) {
    return this.stockService.getAllStock(limit, page)
  }

  @Get(':productId')
  async getStockById(@Param('productId') productId: string) {
    return this.stockService.getStockById(productId)
  }

  @UsePipes(new ZodValidationPipe(createStockSchema))
  @Post()
  async createStock(@Body() { name, quantity, relationId }: CreateStock) {
    return this.stockService.createStock({ name, quantity, relationId })
  }

  @Put(':productId')
  async updateStock(
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(updateStockSchema)) { stock }: UpdateStock) {
    return this.stockService.updateStock(productId, stock)
  }

  @Delete(':productId')
  async deleteStock(@Param('productId') productId: string) {
    return this.stockService.deleteStock(productId)
  }
}
```

As alterações incluem esquemas Zod para validação dos dados de entrada, tipos TypeScript baseados nos esquemas, e aplicação dos pipes para validação automática.

### Parte 5: Autenticação e Configuração

**Instalando o módulo JWT**:

```bash
npm i @nestjs/jwt
```

**Atualizando o módulo principal**:

Em `app.module.ts`, adicione o módulo JWT:

```tsx
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StockModule } from './stock/stock.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/pettech'), StockModule, JwtModule.register({
    global: true,
    secret: 'batman',
    signOptions: { expiresIn: '10m' }
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Esta configuração estabelece um secret para JWT e define o tempo de expiração dos tokens.

**Criando um guard de autenticação**:

Em `src/shared/guards/auth.guard.ts`:

```tsx
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if(!token) {
      throw new UnauthorizedException()
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: 'batman' });

      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException()
    }

    return true
  }
}
```

Este guard valida tokens JWT em requisições protegidas.

**Protegendo rotas**:

Em `stock.controller.ts`, adicione o guard ao método getAllStock:

```tsx
@UseGuards(AuthGuard)
@Get()
async getAllStock(@Query('limit') limit: number, @Query('page') page: number) {
  return this.stockService.getAllStock(limit, page)
}
```

Execute `npm run build` e teste no Postman sem autenticação para verificar a resposta de erro:

```json
{
    "statusCode": 401,
    "timestamp": "2025-02-28T13:41:21.390Z",
    "message": "Unauthorized",
    "path": "/stock?page=1&limit=2"
}
```

**Criando um interceptor de log**:

Em `src/shared/interceptors/loggin.interceptor.ts`:

```tsx
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class LogginInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    console.log(request.headers)

    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`Request time: ${Date.now() - now}ms`))
    )
  }
}
```

Este interceptor registra os cabeçalhos da requisição e mede o tempo de execução.

**Aplicando o interceptor**:

Em `stock.controller.ts`, adicione o decorador de interceptor na classe:

```tsx
@UseInterceptors(LogginInterceptor)
@Controller('stock')
export class StockController {
  // ...
}
```

**Configuração baseada em variáveis de ambiente**:

Instale o módulo de configuração:

```bash
npm i @nestjs/config
```

Atualize o `app.module.ts`:

```tsx
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StockModule } from './stock/stock.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/pettech'), StockModule, JwtModule.register({
    global: true,
    secret: 'batman',
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
```

**Criando arquivos de ambiente**:

Na raiz do projeto, crie o arquivo `.env`:

```
PORT=3010
MONGO_URI=mongodb://localhost:27017/pettech
JWT_SECRET=batman
```

E um arquivo `.env.example`:

```
PORT=
MONGO_URI=
JWT_SECRET=
```

**Utilizando variáveis de ambiente**:

Em `main.ts`:

```tsx
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(Number(process.env.PORT) ?? 3000);
}
bootstrap();
```

Atualize o `app.module.ts` para usar as variáveis de ambiente:

```tsx
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StockModule } from './stock/stock.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/default'),
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
```

### Parte 6: Integração entre Serviços

**Integrando pettech com stock_pettech_product**:

Instale o pacote para requisições HTTP:

```bash
npm i node-fetch
```

**Criando um cliente HTTP**:

Em `pettech/src/utils/client-http.ts`:

```tsx
import fetch from 'node-fetch'

interface IStock {
  name: string
  quantity: number
  relationId: string
}

export async function createProductInStock(product: IStock, token: string) {
  const response = await fetch('http://localhost:3010/stock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  })

  if (!response.ok) {
    throw new Error(`Failed to create product in stock ${response.statusText}`)
  }

  return response
}
```

Esta função faz uma requisição para o serviço de estoque quando um produto é criado.

**Atualizando o controller de produtos**:

Em `pettech/src/http/controllers/product/create.ts`:

```tsx
import { makeCreateProductUseCase } from '@/use-cases/factory/make-create-product-use-case'
import { createProductInStock } from '@/utils/client-http'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const registerBodySchema = z.object({
    name: z.string(),
    description: z.string(),
    image: z.string(),
    price: z.coerce.number(),
    categories: z
      .array(
        z.object({
          id: z.coerce.number().optional(),
          name: z.string(),
        }),
      )
      .optional(),
  })

  const { name, description, image, price, categories } =
    registerBodySchema.parse(request.body)

  const createProductUseCase = makeCreateProductUseCase()

  const product = await createProductUseCase.handler({
    name,
    description,
    image,
    price,
    categories,
  })

  await createProductInStock(
    {
      name: product.name,
      quantity: 0,
      relationId: String(product.id),
    },
    request.headers.authorization?.split(' ')[1] ?? '',
  )

  return reply.status(201).send(product)
}
```

Esta modificação integra a criação de produtos com o sistema de estoque.

**Protegendo a rota de criação no estoque**:

Em `stock_pettech_product/src/stock/controllers/stock.controller.ts`, mova o guard para o método POST:

```tsx
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UseInterceptors, UsePipes } from "@nestjs/common";
import { StockService } from "../services/stock.service";
import { z } from "zod";
import { ZodValidationPipe } from "src/shared/pipe/zod-validation.pipe";
import { AuthGuard } from "src/shared/guards/auth.guard";
import { LogginInterceptor } from "src/shared/interceptors/loggin.interceptor";

const createStockSchema = z.object({
  name: z.string(),
  quantity: z.coerce.number(),
  relationId: z.string()
})

const updateStockSchema = z.object({
  stock: z.coerce.number()
})

type CreateStock = z.infer<typeof createStockSchema>
type UpdateStock = z.infer<typeof updateStockSchema>

@UseInterceptors(LogginInterceptor)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService){}

  @Get()
  async getAllStock(@Query('limit') limit: number, @Query('page') page: number) {
    return this.stockService.getAllStock(limit, page)
  }

  @Get(':productId')
  async getStockById(@Param('productId') productId: string) {
    return this.stockService.getStockById(productId)
  }

  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(createStockSchema))
  @Post()
  async createStock(@Body() { name, quantity, relationId }: CreateStock) {
    return this.stockService.createStock({ name, quantity, relationId })
  }

  @Put(':productId')
  async updateStock(
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(updateStockSchema)) { stock }: UpdateStock) {
    return this.stockService.updateStock(productId, stock)
  }

  @Delete(':productId')
  async deleteStock(@Param('productId') productId: string) {
    return this.stockService.deleteStock(productId)
  }
}
```

Execute ambos os serviços (pettech e stock_pettech_product) com `npm run start:dev` e teste a integração no Postman. A criação de um produto no serviço pettech agora também criará automaticamente um registro correspondente no serviço de estoque.