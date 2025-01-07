import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SSOUser } from './user.schema';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UsersService {
  constructor(@InjectModel(SSOUser.name) private userModel: Model<SSOUser>) {}

  async create(userData: Partial<SSOUser>): Promise<SSOUser> {
    // Check for duplicate email
    const existingUser = await this.userModel.findOne({
      email: userData.email,
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = new this.userModel({
      ...userData,
      password: hashedPassword,
    });
    return user.save();
  }

  async findAll(): Promise<SSOUser[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<SSOUser> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, userData: Partial<SSOUser>): Promise<SSOUser> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, userData, { new: true })
      .exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async validateUser(email: string, password: string): Promise<SSOUser> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user; // Return user if valid
  }

  // Generate JWT Token
  generateToken(user: SSOUser): string {
    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const secret = process.env.JWT_SECRET || 'MY_SUPER_SECRET'; // Use environment variable for the secret
    const token = jwt.sign(payload, secret, { expiresIn: '1h' }); // Token expires in 1 hour

    return token;
  }
}
