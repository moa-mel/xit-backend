import { buildResponse, generateId } from "@/utils";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from 'google-auth-library'
import { AuthService } from "../../auth/services";
import { PrismaService } from "@/modules/core/prisma/services";



@Injectable()
export class GoogleService {
    private oauth2Client: OAuth2Client;

    constructor(
        private configService: ConfigService,
        private authService: AuthService,
        private prisma: PrismaService, 
    ) {
        this.oauth2Client = new OAuth2Client(
            this.configService.get('GOOGLE_CLIENT_ID'),
            this.configService.get('GOOGLE_CLIENT_SECRET'),
            this.configService.get('GOOGLE_CALLBACK_URL')
        );
    }

    async getAuthUrl(): Promise<ApiResponse<{ url: string }>> {
        const url = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['profile', 'email'],
        });

        return buildResponse({
            message: 'Google auth URL generated',
            data: { url },
        });
    }

    async handleGoogleCallback(code: string) {
        const { tokens } = await this.oauth2Client.getToken(code);
        const idToken = tokens.id_token!;
        if (!idToken) throw new Error('No ID token returned from Google');

        const ticket = await this.oauth2Client.verifyIdToken({
            idToken,
            audience: this.configService.get('GOOGLE_CLIENT_ID'),
        });

        const googleUser = ticket.getPayload();
        if (!googleUser?.email || !googleUser.email_verified) {
            throw new Error('Email not verified by Google');
        }

        let user = await this.prisma.user.findUnique({
            where: { email: googleUser.email },
        });

        let isNewUser = false;

        if (!user) {
            const [firstName, ...lastNameParts] = (googleUser.name || '').split(' ');
            const lastName = lastNameParts.join(' ') || '';

            user = await this.prisma.user.create({
                data: {
                    identifier: generateId({ type: 'identifier' }),
                    firstName: firstName || googleUser.given_name || 'User',
                    lastName: lastName || googleUser.family_name || '',
                    email: googleUser.email,
                    password: null,
                    isVerified: true,
                    emailVerifiedAt: new Date(),
                    googleId: googleUser.sub,
                    picture: googleUser.picture,
                },
            });
            isNewUser = true;
        } else if (!user.googleId) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { googleId: googleUser.sub, picture: googleUser.picture, isVerified: true },
            });
        } else {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { picture: googleUser.picture },
            });
        }

        const { accessToken, refreshToken } = await this.authService.generateJwtTokens(user.identifier);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = `${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}&isNewUser=${isNewUser}`;

        return buildResponse({
            message: 'Login successful',
            data: {
                redirectUrl,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    isNewUser,
                },
            },
        });
    }
}

