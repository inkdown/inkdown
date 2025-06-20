import type { FastifyReply, FastifyRequest } from "fastify";

export async function verifyJwt(request: FastifyRequest, reply: FastifyReply){
  try{
    const jwt = await request.jwtVerify();
  
    console.log(jwt);
    /*   const authHeader = request.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null    
      
      reply.status(401).send({
        message: "Token invalid",
      }); */
  }catch(err){
    return reply.status(403).send({
      message: "Unauthorized"
    });
  }
}