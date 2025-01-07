import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SSOUser } from './user.schema';

@Controller('ssousers')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() userData: Partial<SSOUser>): Promise<SSOUser> {
    return this.usersService.create(userData);
  }

  @Get()
  async findAll(): Promise<SSOUser[]> {
    return this.usersService.findAll();
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
