const { Service } = require('typedi');
const { JsonController, Get, Post, Put, Delete, Body, Param, UseInterceptor } = require('routing-controllers');
const { IsEmail, MinLength } = require('class-validator');
const { CacheInterceptor } = require('../interceptors/CacheInterceptor');
const { MetricsInterceptor } = require('../interceptors/MetricsInterceptor');
const { UserService } = require('../services/UserService');
const { logger } = require('../infrastructure/logging');

class CreateUserDto {
  @IsEmail()
  email;

  @MinLength(8)
  password;

  role;
  metadata;
}

@JsonController('/users')
@Service()
class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @UseInterceptor(CacheInterceptor, MetricsInterceptor)
  async getUsers() {
    try {
      const users = await this.userService.findAll();
      return { success: true, data: users };
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  }

  @Get('/:id')
  @UseInterceptor(CacheInterceptor)
  async getUser(@Param('id') id: string) {
    try {
      const user = await this.userService.findById(id);
      return { success: true, data: user };
    } catch (error) {
      logger.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  @Post()
  async createUser(@Body() userData: CreateUserDto) {
    try {
      const user = await this.userService.create(userData);
      return { success: true, data: user };
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  @Put('/:id')
  async updateUser(@Param('id') id: string, @Body() userData: Partial<CreateUserDto>) {
    try {
      const user = await this.userService.update(id, userData);
      return { success: true, data: user };
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  @Delete('/:id')
  async deleteUser(@Param('id') id: string) {
    try {
      await this.userService.delete(id);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  // Example data structure for user creation:
  /*
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "role": "user",
    "metadata": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "department": "Engineering"
    }
  }
  */
}

module.exports = UserController;