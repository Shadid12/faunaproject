import { Client } from "fauna";

export const faunaClient = new Client({
  secret: process.env.FAUNA_SECRET,
});