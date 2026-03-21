import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/wishlist.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get wishlist items' })
  async getWishlist(@Req() req: any) {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add product to wishlist' })
  async addToWishlist(@Req() req: any, @Body() dto: AddToWishlistDto) {
    return this.wishlistService.addToWishlist(req.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove item from wishlist' })
  async removeFromWishlist(@Req() req: any, @Param('id') id: string) {
    return this.wishlistService.removeFromWishlist(req.user.id, id);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Clear entire wishlist' })
  async clearWishlist(@Req() req: any) {
    return this.wishlistService.clearWishlist(req.user.id);
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Check if product is wishlisted' })
  async isWishlisted(@Req() req: any, @Param('productId') productId: string) {
    const wishlisted = await this.wishlistService.isWishlisted(
      req.user.id,
      productId,
    );
    return { wishlisted };
  }

  @Post(':id/move-to-cart')
  @ApiOperation({ summary: 'Move wishlist item to cart' })
  async moveToCart(@Req() req: any, @Param('id') id: string) {
    return this.wishlistService.moveToCart(req.user.id, id);
  }
}