import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    private readonly cartService: CartService,
  ) {}

  /**
   * Generate a unique order number: AMC-20260321-XXXXX
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `AMC-${dateStr}-${rand}`;
  }

  /**
   * CREATE ORDER — converts cart → order
   *
   * Flow:
   * 1. Get user's cart
   * 2. Validate cart is not empty
   * 3. Create order + order items
   * 4. Mock payment (auto-confirm)
   * 5. Clear cart
   * 6. Return order
   *
   * When Razorpay is integrated:
   * - Step 4 changes to: create Razorpay payment link, return it
   * - Order stays PENDING until webhook confirms payment
   * - Add a POST /orders/webhook endpoint for Razorpay callbacks
   */
  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    // 1. Get cart
    const cart = await this.cartService.getCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. Calculate totals
    const subtotal = cart.subtotal;
    const shippingCost = subtotal >= 999 ? 0 : 9.99;
    const totalAmount = Math.round((subtotal + shippingCost) * 100) / 100;

    // 3. Create order
    const order = this.orderRepo.create({
      orderNumber: this.generateOrderNumber(),
      userId,
      status: OrderStatus.PENDING,
      subtotal,
      shippingCost,
      totalAmount,
      shippingAddress: dto.shippingAddress || '',
    });

    const savedOrder = await this.orderRepo.save(order);

    // 4. Create order items from cart
    const orderItems = cart.items.map((cartItem) =>
      this.orderItemRepo.create({
        orderId: savedOrder.id,
        productId: cartItem.productId,
        productTitle: cartItem.productTitle,
        productImage: cartItem.productImage,
        quantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
      }),
    );

    await this.orderItemRepo.save(orderItems);

    // 5. Mock payment — auto-confirm
    // TODO: Replace with Razorpay integration
    savedOrder.status = OrderStatus.CONFIRMED;
    savedOrder.paymentId = `MOCK-${Date.now()}`;
    savedOrder.paymentMethod = 'mock';
    await this.orderRepo.save(savedOrder);

    this.logger.log(
      `Order created: ${savedOrder.orderNumber} for user ${userId} — $${totalAmount}`,
    );

    // 6. Clear cart
    await this.cartService.clearCart(userId);

    // 7. Return full order with items
    const orderWithItems = await this.orderRepo.findOne({
      where: { id: savedOrder.id },
      relations: ['items'],
    });

    if (!orderWithItems) {
      throw new NotFoundException(`Order not found`);
    }

    return orderWithItems;
  }

  /**
   * GET USER'S ORDERS — order history
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * GET SINGLE ORDER — order detail
   */
  async getOrderById(userId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * GET ORDER BY ORDER NUMBER
   */
  async getOrderByNumber(userId: string, orderNumber: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { orderNumber, userId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * CANCEL ORDER — only if still pending/confirmed
   */
  async cancelOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.getOrderById(userId, orderId);

    if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel a shipped or delivered order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    order.status = OrderStatus.CANCELLED;
    return this.orderRepo.save(order);
  }
}