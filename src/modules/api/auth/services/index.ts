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

        const identifier = await this.redisService.get(`otp:${options.otp}`);

        if (!identifier) {
            throw new Error("Invalid or expired OTP");
        }

        const user = await this.prisma.user.findUnique({
            where: { identifier }
        });

        if (!user) {
            throw new Error("User not found");
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                emailVerifiedAt: new Date()
            }
        });

        await this.redisService.del(`otp:${options.otp}`);

        return buildResponse({
            message: "Email verified successfully"
        });
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

        const identifier = await this.redisService.get(`resetOtp:${options.otp}`)

        if (!identifier) {
            throw new Error("Invalid or expired OTP");
        }

        const user = await this.prisma.user.findUnique({
            where: { identifier }
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Store user ID as string with user-specific key
        await this.redisService.set(
            `resetAllowed:${user.identifier}`,
            user.id.toString(),
            'EX',
            600
        ); // expires in 10 mins


        return buildResponse({
            message: "OTP verified successfully"
        })
    }

    async resetPassword(options: ResetPasswordDto) {
        if (options.password !== options.confirmPassword) {
            throw new Error('Passwords do not match');
        }

        // Get the user ID that is allowed to reset password
        const userIdStr = await this.redisService.get("resetAllowed:user");
        if (!userIdStr) {
            throw new Error("Reset permission expired or OTP not verified");
        }

        // Convert string back to number
        const userId = parseInt(userIdStr, 10);

        const user = await this.prisma.user.findUnique({
            where: { id: userId } // now correctly typed
        });

        if (!user) {
            throw new Error('User not found');
        }

        const hashedPassword = await bcrypt.hash(options.password, 10);

        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        // Clean up
        await this.redisService.del(`resetAllowed:user`);
        await this.redisService.del(`resetOtp:${user.identifier}`);

        return buildResponse({
            message: "Password reset successfully"
        });
    }


}