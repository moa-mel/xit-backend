import { Body, Controller, HttpCode, HttpStatus, Post, ValidationPipe } from "@nestjs/common";
import { AuthService } from "../services";
import { SignInDto, SignUpDto } from "../dtos";

@Controller({
  path: 'auth',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('signup')
  async signUp(@Body(ValidationPipe) dto: SignUpDto): Promise<ApiResponse> {
    return await this.authService.signUp(dto);
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


}