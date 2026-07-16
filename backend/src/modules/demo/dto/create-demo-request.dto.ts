import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

// Public "Book a demo" lead form.
export class CreateDemoRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  hospitalName!: string;

  @IsString()
  @MinLength(7, { message: "Enter a valid contact number" })
  @MaxLength(30)
  contactNumber!: string;

  @IsEmail({}, { message: "Enter a valid email address" })
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  hospitalAddress!: string;

  @IsDateString({}, { message: "Choose a preferred date" })
  preferredDate!: string; // "yyyy-mm-dd"

  @Matches(/^\d{2}:\d{2}$/, { message: "Choose a preferred time" })
  preferredTime!: string; // "HH:mm"
}
