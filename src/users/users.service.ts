import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
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
    try {
      // Check if the user already exists
      const existingUser = await this.userModel.findOne({
        email: userData.email,
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create and save the new user
      const user = new this.userModel({
        ...userData,
        password: hashedPassword,
      });
      return await user.save();
    } catch (error) {
      // Handle known error types
      if (error instanceof ConflictException) {
        throw error; // Re-throw to maintain context
      }
      // Handle other potential errors
      throw new InternalServerErrorException(
        'An error occurred while creating the user'
      );
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: any; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit; // Calculate documents to skip
      const total = await this.userModel.countDocuments().exec(); // Get total number of documents
      const data = await this.userModel.find().skip(skip).limit(limit).exec(); // Fetch paginated data

      return { data, total, page, limit };
    } catch (error) {
      throw new Error('Database query failed');
    }
  }

  async findOne(id: string): Promise<SSOUser> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred while fetching the user'
      );
    }
  }

  async update(id: string, userData: Partial<SSOUser>): Promise<SSOUser> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, userData, { new: true })
        .exec();
      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while updating the user'
      );
    }
  }

  async delete(id: string): Promise<SSOUser> {
    try {
      const result = await this.userModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while deleting the user'
      );
    }
  }

  async validateUser(email: string, password: string): Promise<SSOUser> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      return user; // Return user if valid
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while validating the user'
      );
    }
  }

  // Generate JWT Token
  generateToken(user: SSOUser): string {
    try {
      const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      const secret = process.env.JWT_SECRET || 'MY_SUPER_SECRET'; // Use environment variable for the secret
      return jwt.sign(payload, secret, { expiresIn: '1h' }); // Token expires in 1 hour
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred while generating the token'
      );
    }
  }
}
