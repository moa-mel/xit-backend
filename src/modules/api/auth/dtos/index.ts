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

export class VerifyEmailDto {

    @IsString()
    @IsNotEmpty()
    otp: string;
}

export class SignInDto {
    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class ForgetPasswordDto {
    @IsString()
    @IsEmail()
    email: string;
}

export class ConfirmResetEmailDto {

    @IsString()
    @IsNotEmpty()
    otp: string;
}

export class ResetPasswordDto {

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    confirmPassword: string;
}
