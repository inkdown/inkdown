import { app } from "@/app";
import { env } from "@inkdown/env";

try{
  app.listen({ port: 3333, host: "0.0.0.0" }).then(() => {
    console.log("Server running in 3333");
    console.log(env.NODE_ENV);

  });
}catch(err){
  console.log(err);
  process.exit(1);
}