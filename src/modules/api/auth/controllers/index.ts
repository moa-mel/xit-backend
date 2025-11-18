import { Controller } from "@nestjs/common";
import { AuthService } from "../services";

@Controller({
  path: 'auth',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}
}