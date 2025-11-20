import { PrismaService } from '@/modules/core/prisma/services';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as bcrypt from 'bcryptjs';
import { refreshJwtSecret, refreshTokenExpiresIn } from '@/config';
import { buildResponse, generateId } from '@/utils';
import { ConfirmResetEmailDto, ForgetPasswordDto, ResetPasswordDto, SignInDto, SignUpDto, VerifyEmailDto } from '../dtos';
import { LoginMeta } from '../interfaces';
import { EmailService } from '../../email/services';

export class AuthService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
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
                isVerified: false,
                emailVerifiedAt: null

            }
        })

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

        //save OTP to redis
        await this.redisService.set(
            `otp:${user.identifier}`,
            otp,
            'EX',
            5 * 60 // 5 minutes
        );

        //send OTP to user email
        await this.emailService.sendEmailOTP(user.firstName, user.email, otp);

        return buildResponse({
            message: 'User created Successfully. Check your email for verification code',
            data: user
        })
    }

    async verifyEmail(options: VerifyEmailDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: options.email
            }
        })

        if (!user) {
            throw new Error('user not found')
        }

        const savedOtp = await this.redisService.get(`otp:${user.identifier}`)

        if (!savedOtp) {
            throw new Error('OTP expired')
        }

        if (savedOtp !== options.otp) {
            throw new Error('Invalid OTP')
        }

        await this.prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                isVerified: true,
                emailVerifiedAt: new Date()
            }
        });

        await this.redisService.del(`otp:${user.identifier}`)

        return buildResponse({
            message: "Email verified successfully"
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

    async signOut(accessToken: string) {
        console.log('accessToken', accessToken)
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

        return buildResponse({
            message: "User Logged out successfully",
        })

    }

    async forgetPassword(options: ForgetPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: options.email
            }
        })

        if (!user) {
            throw new Error('User not found')
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

        //send OTP to user email
        await this.emailService.sendPasswordResetOTP(user.firstName, user.email, otp);

        return buildResponse({
            message: "Password reset OTP sent to your email"
        });

    }

    async confirmResetEmail(options: ConfirmResetEmailDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: options.email
            }
        })

        if (!user) {
            throw new Error("user not found")
        }

        const savedOtp = await this.redisService.get(`resetOtp:${user.identifier}`)

        if (!savedOtp) {
            throw new Error('OTP expired')
        }

        if (savedOtp !== options.otp) {
            throw new Error('Invalid OTP')
        }

        return buildResponse({
            message: "OTP verified successfully"
        })
    }

    async resetPassword(options: ResetPasswordDto) {
        if (options.password !== options.confirmPassword) {
            throw new Error('Password do not match')
        }

        const user = await this.prisma.user.findUnique({
            where: {
                email: options.email
            }
        })

        if (!user) {
            throw new Error('User not found')
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(options.password, 10);

        // Update password
        await this.prisma.user.update({
            where: { email: options.email },
            data: { password: hashedPassword }
        });

        // Delete reset OTP after successful password reset
        await this.redisService.del(`resetOtp:${user.identifier}`);

        return buildResponse({
            message: "Password reset successfully"
        });
    }

}