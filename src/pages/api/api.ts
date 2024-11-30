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
  console.log(mockDatabase)


  const contents = `export const mockDatabase = ${JSON.stringify(mockDatabase, null, 2)}`;

  fs.writeFileSync("./src/pages/api/data.ts", contents)

  
  console.log("todo ok")
  res.status(200).json({message: "vote data added succesfully"});
}


/*
(err) => {
      if (err) {
        console.log(err)
      } else {
        console.log("todo piola")
      }
    }

*/