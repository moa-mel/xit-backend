import { Controller, Get, Query } from "@nestjs/common";
import { GoogleService } from "../services";


@Controller('auth/google')
export class GoogleController {
    constructor(private googleService: GoogleService) {}

    @Get('url')
    getGoogleAuthUrl(){
        return this.googleService.getAuthUrl();
    }

@Get('callback')
async googleLogin(@Query('code') code: string) {
    await this.googleService.handleGoogleCallback(code);
}

}
