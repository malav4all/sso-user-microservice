import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SSOUser } from './user.schema';

@Controller('ssousers')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(
    @Body() userData: Partial<SSOUser>
  ): Promise<{ message: string } | { error: string }> {
    try {
      await this.usersService.create(userData);
      return {
        message: 'Client added successfully',
      };
    } catch (error) {
      return { error: 'Failed to add product. Please try again.' };
    }
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ): Promise<
    | { data: any; total: number; page: number; limit: number }
    | { error: string }
  > {
    try {
      const pageNumber = Number(page);
      const limitNumber = Number(limit);

      if (isNaN(pageNumber) || pageNumber < 1) {
        throw new Error(
          'Invalid page number. Page must be a positive integer.'
        );
      }
      if (isNaN(limitNumber) || limitNumber < 1) {
        throw new Error(
          'Invalid limit number. Limit must be a positive integer.'
        );
      }

      return await this.usersService.findAll(pageNumber, limitNumber);
    } catch (error) {
      return {
        error:
          error.message ||
          'An error occurred while fetching products. Please try again later.',
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SSOUser> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() userData: Partial<SSOUser>
  ): Promise<SSOUser> {
    return this.usersService.update(id, userData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }

  @Post('login')
  async login(
    @Body() loginData: { email: string; password: string }
  ): Promise<{ accessToken: string }> {
    const { email, password } = loginData;

    // Validate user credentials
    const user = await this.usersService.validateUser(email, password);

    // Generate JWT token
    const accessToken = this.usersService.generateToken(user);

    return { accessToken, ...user };
  }
}
