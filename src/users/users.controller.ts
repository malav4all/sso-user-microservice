import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
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
    | { data: SSOUser; total: number; page: number; limit: number }
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
  ): Promise<{ message: string }> {
    try {
      const updatedUser = await this.usersService.update(id, userData);

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return {
        message: `User ${updatedUser.name} updated successfully`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw known error
      }

      // Handle unexpected errors
      throw new InternalServerErrorException(
        'An error occurred while updating the user'
      );
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    try {
      const result = await this.usersService.delete(id);

      if (!result) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return {
        message: `User with ID ${id} deleted successfully`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw known error
      }

      // Handle unexpected errors
      throw new InternalServerErrorException(
        'An error occurred while deleting the user'
      );
    }
  }

  @Post('login')
  async login(@Body() loginData: { email: string; password: string }): Promise<{
    message: string;
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      company: string;
      role: string[];
    };
  }> {
    try {
      const { email, password } = loginData;

      // Validate user credentials
      const user = await this.usersService.validateUser(email, password);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const accessToken = this.usersService.generateToken(user);

      // Create user details object excluding the password
      const { _id, name, email: userEmail, company, role } = user;
      const userDetails = {
        id: _id as string, // Explicitly cast _id to string
        name,
        email: userEmail,
        company,
        role,
      };

      return {
        message: `Welcome ${name}`,
        accessToken,
        user: userDetails,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw known error
      }

      // Handle unexpected errors
      throw new InternalServerErrorException(
        'An error occurred while processing the login request'
      );
    }
  }
}
