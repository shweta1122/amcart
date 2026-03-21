import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/order.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * POST /api/orders
   * Create order from cart → mock payment → confirm
   */
  @Post()
  @ApiOperation({ summary: 'Create order from cart (checkout)' })
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(req.user.id, dto);
  }

  /**
   * GET /api/orders
   * Get all orders for the authenticated user
   */
  @Get()
  @ApiOperation({ summary: 'Get order history' })
  async getOrders(@Req() req: any) {
    return this.orderService.getUserOrders(req.user.id);
  }

  /**
   * GET /api/orders/:id
   * Get a specific order by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  async getOrder(@Req() req: any, @Param('id') id: string) {
    return this.orderService.getOrderById(req.user.id, id);
  }

  /**
   * POST /api/orders/:id/cancel
   * Cancel an order
   */
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  async cancelOrder(@Req() req: any, @Param('id') id: string) {
    return this.orderService.cancelOrder(req.user.id, id);
  }
}