import { PrismaService } from '@/modules/core/prisma/services';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as bcrypt from 'bcryptjs';
import { refreshJwtSecret, refreshTokenExpiresIn } from '@/config';
import { buildResponse, generateId } from '@/utils';
import { SignInDto, SignUpDto } from '../dtos';
import { LoginMeta } from '../interfaces';

export class AuthService {
    constructor(
        private prisma: PrismaService,
        private readonly jwtService: JwtService,
        @InjectRedis() private readonly redisService: Redis
    ) { }

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash)
    }

    private async generateTokenAndSaveToRedis(minutes: number, email: string) {
        const token = generateId({ type: 'token', length: 32 })

        await this.redisService.set(`verify:${token}`, email, 'EX', minutes * 60)

        return { token };

    }

    private async generateJwtTokens(userId: string) {
        const accessToken = await this.jwtService.signAsync({
            sub: userId,
        })
        const refreshToken = this.jwtService.sign({ sub: userId },
            {
                secret: refreshJwtSecret,
                expiresIn: refreshTokenExpiresIn as any
            }
        )
        await this.redisService.set(
            `refreshToken:${userId}`,
            refreshToken,
            'EX',
            15 * 24 * 60 * 60
        );
        return { accessToken, refreshToken }
    }

    async signUp(options: SignUpDto) {
        const user = await this.prisma.user.create({
            data: {
                identifier: generateId({ type: 'identifier' }),
                firstName: options.firstName,
                lastName: options.lastName,
                email: options.email,
                password: await bcrypt.hash(options.password, 10),
            }
        })

        return buildResponse({
            message: 'User created Successfully',
            data: user
        })
    }

    async signIn(options: SignInDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: options.email
            },
            select: {
                id: true,
                identifier: true,
                firstName: true,
                lastName: true,
                email: true,
                password: true
            }
        });

        if (!user) {
            throw new Error('User not found')
        }

        const validPassword = await this.comparePassword(
            options.password,
            user.password,
        );

        if (!validPassword) {
            throw new Error('Invalid credentials')
        }

        const { accessToken, refreshToken } = await this.generateJwtTokens(
            user.identifier
        );

        const loginData: LoginMeta = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        }

        return buildResponse({
            message: "User Logged in successfully",
            data: {
                accessToken,
                refreshToken,
                meta: loginData,
            }
        })
    }

    async signOut(accessToken: string): Promise<void> {
        const decodeToken = this.jwtService.decode(accessToken);
        if (!decodeToken) {
            throw new Error('Invalid token')
        }

        // Blacklist the access token
        await this.redisService.set(
            `blacklist:${accessToken}`,
            'revoked',
            'EX',
            decodeToken.exp - Math.floor(Date.now() / 1000)
        );

        // Also delete the refresh token for the user
        await this.redisService.del(`refreshToken:${decodeToken.sub}`);

    }

}