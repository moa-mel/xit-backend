import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignUpDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class SignInDto {
    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
