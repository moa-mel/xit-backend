import { Controller, Get, Query, Res } from "@nestjs/common";
import { GoogleService } from "../services";
import { Response } from 'express';

@Controller('auth/google')
export class GoogleController {
    constructor(private googleService: GoogleService) { }

    @Get('url')
    async getGoogleAuthUrl(@Res() res: Response) {
        const url = await this.googleService.generateAuthUrl();
        return res.redirect(url);
    }


    @Get('callback')
    async googleLogin(
        @Query('code') code: string,
        @Res() res: Response,
    ) {
        const result = await this.googleService.handleGoogleCallback(code);
        return res.redirect(result.data.redirectUrl);
    }


}
