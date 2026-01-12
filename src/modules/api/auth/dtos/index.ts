import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';


export enum VerificationType {
    SIGNUP = 'signup',
    RESET = 'reset',
}

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

    @IsEnum(VerificationType)
    type: VerificationType;

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

export class ResetPasswordDto {

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    confirmPassword: string;
}

export class UpdateProfileDto{
    @IsString()
    @IsOptional()
    firstName: string;

    @IsString()
    @IsOptional()
    lastName: string;

    @IsString()
    @IsOptional()
    picture: string;


}
