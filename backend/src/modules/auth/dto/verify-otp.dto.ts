import { IsEmail, Matches } from "class-validator";

// Step 2 of signup — verify the emailed code and create the account.
export class VerifyOtpDto {
  @IsEmail({}, { message: "Enter a valid email address" })
  email!: string;

  @Matches(/^\d{6}$/, { message: "Enter the 6-digit code" })
  otp!: string;
}
