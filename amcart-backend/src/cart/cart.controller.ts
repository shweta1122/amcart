import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get cart with items and totals' })
  async getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add product to cart' })
  async addToCart(@Req() req: any, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateQuantity(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateQuantity(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeFromCart(@Req() req: any, @Param('id') id: string) {
    return this.cartService.removeFromCart(req.user.id, id);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Clear entire cart' })
  async clearCart(@Req() req: any) {
    return this.cartService.clearCart(req.user.id);
  }

  @Post(':id/move-to-wishlist')
  @ApiOperation({ summary: 'Move cart item to wishlist' })
  async moveToWishlist(@Req() req: any, @Param('id') id: string) {
    return this.cartService.moveToWishlist(req.user.id, id);
  }
}