// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import { mockDatabase } from "./data.ts";


type Data = {
  name: string;
};




export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
    // Return mockDatabase to the client.
    res.status(200).json(mockDatabase);
}