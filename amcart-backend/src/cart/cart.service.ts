import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { WishlistService } from '../wishlist/wishlist.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepo: Repository<CartItem>,
    @Inject(forwardRef(() => WishlistService))
    private readonly wishlistService: WishlistService,
  ) {}

  async getCart(userId: string) {
    const items = await this.cartRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );

    return {
      items,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Math.round(subtotal * 100) / 100,
    };
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<CartItem> {
    const existing = await this.cartRepo.findOne({
      where: { userId, productId: dto.productId },
    });

    if (existing) {
      existing.quantity += dto.quantity || 1;
      existing.unitPrice = dto.unitPrice;
      return this.cartRepo.save(existing);
    }

    const item = this.cartRepo.create({
      userId,
      productId: dto.productId,
      quantity: dto.quantity || 1,
      unitPrice: dto.unitPrice,
      productTitle: dto.productTitle,
      productImage: dto.productImage,
    });

    return this.cartRepo.save(item);
  }

  async updateQuantity(
    userId: string,
    cartItemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartItem> {
    const item = await this.cartRepo.findOne({
      where: { id: cartItemId, userId },
    });

    if (!item) throw new NotFoundException('Cart item not found');

    item.quantity = dto.quantity;
    return this.cartRepo.save(item);
  }

  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    const item = await this.cartRepo.findOne({
      where: { id: cartItemId, userId },
    });

    if (!item) throw new NotFoundException('Cart item not found');

    await this.cartRepo.remove(item);
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepo.delete({ userId });
  }

  async moveToWishlist(userId: string, cartItemId: string) {
    const item = await this.cartRepo.findOne({
      where: { id: cartItemId, userId },
    });

    if (!item) throw new NotFoundException('Cart item not found');

    await this.wishlistService.addToWishlist(userId, {
      productId: item.productId,
      productTitle: item.productTitle,
      productImage: item.productImage,
      unitPrice: item.unitPrice,
    });

    await this.cartRepo.remove(item);

    return { message: 'Moved to wishlist' };
  }
}