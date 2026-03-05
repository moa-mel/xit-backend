import { Body, Controller, HttpCode, Put, HttpStatus, ValidationPipe, Param } from "@nestjs/common";
import { UserService } from "../services";
import { UpdateProfileDto } from "../dtos";

@Controller({
    path: 'user',
})
export class UserController {
    constructor(private readonly userService: UserService) { }

    @HttpCode(HttpStatus.OK)
    @Put('user/:id')
    async updateProfile(@Param('id') id: number, @Body(ValidationPipe) dto: UpdateProfileDto): Promise<ApiResponse> {
        return await this.userService.updateProfile(dto, +id);
    }
}