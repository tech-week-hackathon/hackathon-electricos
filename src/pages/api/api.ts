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
  mockDatabase.push(req.body)


  const contents = `export const mockDatabase = ${JSON.stringify(mockDatabase, null, 2)}`;

  fs.writeFileSync("./src/pages/api/data.ts", contents)

  
  res.status(200).json(mockDatabase);
}
