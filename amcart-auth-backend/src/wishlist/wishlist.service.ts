import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { AddToWishlistDto } from './dto/wishlist.dto';
import { CartService } from '../cart/cart.service';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepo: Repository<WishlistItem>,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
  ) {}

  async getWishlist(userId: string) {
    const items = await this.wishlistRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      items,
      itemCount: items.length,
    };
  }

  async addToWishlist(
    userId: string,
    dto: AddToWishlistDto,
  ): Promise<WishlistItem> {
    const existing = await this.wishlistRepo.findOne({
      where: { userId, productId: dto.productId },
    });

    if (existing) {
      if (dto.productTitle) existing.productTitle = dto.productTitle;
      if (dto.productImage) existing.productImage = dto.productImage;
      if (dto.unitPrice) existing.unitPrice = dto.unitPrice;
      return this.wishlistRepo.save(existing);
    }

    const item = this.wishlistRepo.create({
      userId,
      productId: dto.productId,
      productTitle: dto.productTitle,
      productImage: dto.productImage,
      unitPrice: dto.unitPrice,
    });

    return this.wishlistRepo.save(item);
  }

  async removeFromWishlist(
    userId: string,
    wishlistItemId: string,
  ): Promise<void> {
    const item = await this.wishlistRepo.findOne({
      where: { id: wishlistItemId, userId },
    });

    if (!item) throw new NotFoundException('Wishlist item not found');

    await this.wishlistRepo.remove(item);
  }

  async clearWishlist(userId: string): Promise<void> {
    await this.wishlistRepo.delete({ userId });
  }

  async isWishlisted(userId: string, productId: string): Promise<boolean> {
    const count = await this.wishlistRepo.count({
      where: { userId, productId },
    });
    return count > 0;
  }

  async moveToCart(userId: string, wishlistItemId: string) {
    const item = await this.wishlistRepo.findOne({
      where: { id: wishlistItemId, userId },
    });

    if (!item) throw new NotFoundException('Wishlist item not found');

    await this.cartService.addToCart(userId, {
      productId: item.productId,
      quantity: 1,
      unitPrice: Number(item.unitPrice) || 0,
      productTitle: item.productTitle,
      productImage: item.productImage,
    });

    await this.wishlistRepo.remove(item);

    return { message: 'Moved to cart' };
  }
}