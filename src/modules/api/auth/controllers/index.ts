import { Body, Controller, HttpCode, HttpStatus, Param, Post, ValidationPipe } from "@nestjs/common";
import { AuthService } from "../services";
import { ConfirmResetEmailDto, ForgetPasswordDto, ResetPasswordDto, SignInDto, SignUpDto, VerifyEmailDto } from "../dtos";

@Controller({
  path: 'auth',
})
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('signup')
  async signUp(@Body(ValidationPipe) dto: SignUpDto): Promise<ApiResponse> {
    return await this.authService.signUp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-email/:identifier')
  async verifyEmail(@Param('identifier') identifier: string, @Body(ValidationPipe) dto: VerifyEmailDto): Promise<ApiResponse> {
    return await this.authService.verifyEmail(dto, identifier);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body(ValidationPipe) dto: SignInDto): Promise<ApiResponse> {
    return await this.authService.signIn(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logOut(
    @Body() body: { accessToken: string }
  ): Promise<ApiResponse> {
    return this.authService.signOut(body.accessToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forget-password')
  async forgetPassword(@Body(ValidationPipe) dto: ForgetPasswordDto): Promise<ApiResponse> {
    return await this.authService.forgetPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('confirm-reset-email/:identifier')
  async confirmResetEmail(@Param('identifier') identifier: string, @Body(ValidationPipe) dto: ConfirmResetEmailDto): Promise<ApiResponse> {
    return await this.authService.confirmResetEmail(dto, identifier);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password/:identifier')
  async resetPassword(@Param('identifier') identifier: string, @Body(ValidationPipe) dto: ResetPasswordDto): Promise<ApiResponse> {
    return await this.authService.resetPassword(dto, identifier);
  }


}