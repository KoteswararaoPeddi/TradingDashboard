import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

// Step 1 of signup — hospital + admin details. Triggers an email OTP.
export class SignupRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  hospitalName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  adminName!: string;

  @IsEmail({}, { message: "Enter a valid email address" })
  email!: string;

  @IsOptional()
  @Matches(/^\d{10}$/, { message: "Enter a valid 10-digit mobile number" })
  phone?: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(72)
  password!: string;
}
