import { FileMetadata } from "./filemetadata";


export type User = {
  id: string;
  firstName: string;
  otherNames: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
  campusId: string;
  userType: "regular";
  dob: string;
  gender: "male" | "female";
  photo?: FileMetadata;
};

