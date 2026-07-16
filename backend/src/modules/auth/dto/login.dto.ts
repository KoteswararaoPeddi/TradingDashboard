import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Enter a valid email address" })
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
