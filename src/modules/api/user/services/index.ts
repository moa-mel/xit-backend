import { PrismaService } from '@/modules/core/prisma/services';
import { UserNotFoundException } from '../../auth/errors';
import { HttpStatus } from '@nestjs/common';
import { buildResponse } from '@/utils';
import { UpdateProfileDto } from '../dtos';

export class UserService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async updateProfile(dto: UpdateProfileDto, userId: number) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new UserNotFoundException('User not found', HttpStatus.BAD_REQUEST);
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                firstName: dto.firstName ?? user.firstName,
                lastName: dto.lastName ?? user.lastName,
                picture: dto.picture ?? user.picture
            }
        });

        return buildResponse({
            message: 'Profile updated successfully',
            data: updatedUser
        });
    }
}